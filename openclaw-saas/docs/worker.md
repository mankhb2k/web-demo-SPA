# OpenClaw SaaS — Worker & VPS Management

> **VPS:** Contabo · 12 vCPU · 48GB RAM · 250GB NVMe · Ubuntu 22.04 LTS  
> **Chạy trên VPS:** Docker Engine · Traefik · openclaw-worker · Redis (MVP) · User containers

---

## 1. Tổng quan services trên VPS

```
VPS Ubuntu 22.04
├── Docker Engine
├── docker network: openclaw-net
├── Traefik v3          ← TLS termination, auto-route per subdomain
├── Redis               ← BullMQ broker (MVP), chuyển Railway managed khi multi-VPS
├── openclaw-worker     ← BullMQ consumer, Docker SDK
└── containers/
    ├── openclaw-usr_abc (free:  512MB, 0.2 vCPU  — chat + AI API only)
    ├── openclaw-usr_def (pro:  2048MB, 1.0 vCPU  — Playwright + FFmpeg + tools)
    └── ...
```

**Railway chỉ chạy:** NestJS API + PostgreSQL  
**Redis path:**
- MVP (1 VPS): Redis container trên VPS — zero latency, đơn giản
- Multi-VPS: chuyển sang Railway managed Redis — chỉ đổi `REDIS_URL` trong worker env
- >10,000 users: Dedicated Redis VPS + Sentinel nếu muốn tách khỏi Railway

---

## 2. Capacity Planning

### Resource limit theo tier

| Tier | RAM limit | CPU limit | Được dùng |
|---|---|---|---|
| **Free** | 512MB | 0.2 vCPU | Chat, AI API calls, platform integrations |
| **Pro** | 2048MB | 1.0 vCPU | + Playwright, FFmpeg, shell tools, automation |

**Lý do Free = 512MB:**
```
OpenClaw không có heavy tools (chỉ chat + AI API):
  Runtime base:           ~150MB
  AI context + state:     ~100MB
  SQLite + I/O buffers:    ~50MB
  Headroom spikes:        ~200MB
  ────────────────────────────────
  Total:                  ~500MB → 512MB limit vừa đủ, ổn định
```

**Lý do Pro = 2GB:**
```
Playwright (Chromium headless):  ~500MB
FFmpeg (video 1080p):            ~400MB
OpenClaw base:                   ~300MB
Buffer đồng thời cả hai:         ~300MB + overhead
────────────────────────────────────────
Total worst case:               ~1.5GB → 2GB để ổn định, không OOM
CPU 1 vCPU: FFmpeg transcoding + Playwright rendering cần CPU thật
```

### Capacity VPS (48GB / 12 vCPU)

```
Reserved (system + infra):  ~3.0 GB
Available:                  ~45 GB

── Free tier containers (512MB / 0.2 vCPU) ──
  Max concurrent (RAM):  45,000 / 512  ≈ 87
  Max concurrent (CPU):  12 / 0.2      = 60  ← CPU bottleneck
  Comfortable:           ~50 containers
  Với idle-shutdown 15% active rate: ~330 users/VPS

── Pro tier containers (2GB / 1.0 vCPU) ──
  Max concurrent (RAM):  45,000 / 2048 ≈ 22
  Max concurrent (CPU):  12 / 1.0      = 12  ← CPU bottleneck
  Comfortable:           ~8–10 containers
  Với idle-shutdown 20% active rate: ~40–50 pro users/VPS

── Mixed (MVP thực tế: chủ yếu free) ──
  Giả sử 40 free + 5 pro đồng thời:
    RAM:  40×512 + 5×2048  = 20,480 + 10,240 = ~30GB  ✓
    CPU:  40×0.2 + 5×1.0   = 8 + 5            = 13 vCPU ≈ limit
  → Comfortable với 35 free + 4 pro active cùng lúc
```

**Pro users cần VPS riêng khi scale:**
```
Mỗi pro container ăn 1 vCPU — 12 pro users đồng thời = hết CPU VPS
Khi có >20 pro users: tách 1 VPS riêng cho pro tier
Lợi: free users không bị ảnh hưởng khi pro users chạy FFmpeg nặng
```

**Storage:**
```
Free:  ~100MB/user × 330 users = 33GB
Pro:   ~500MB/user × 50 users  = 25GB  (video attachments nhiều hơn)
Total: ~58GB → 250GB NVMe ổn, còn buffer
```

---

## 3. Setup VPS từ đầu

### 3.1 OS hardening
```bash
apt update && apt upgrade -y

# Firewall: chỉ mở cần thiết
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Traefik redirect về HTTPS)
ufw allow 443/tcp   # HTTPS
ufw enable

# KHÔNG mở Docker TCP port (2375/2376) — worker dùng Unix socket

# SSH key only
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Non-root user
useradd -m -s /bin/bash openclaw
usermod -aG docker openclaw
```

### 3.2 Docker Engine
```bash
curl -fsSL https://get.docker.com | bash
systemctl enable docker

# Network cho tất cả containers + Traefik
docker network create openclaw-net
```

### 3.3 Thư mục structure
```bash
mkdir -p /opt/traefik/certs
mkdir -p /opt/redis
mkdir -p /opt/worker
mkdir -p /data/users         # persistent volumes

chmod 700 /data/users
chown openclaw:openclaw /data/users
```

---

## 4. Traefik v3 — Setup

```yaml
# /opt/traefik/docker-compose.yml
services:
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false   # containers phải opt-in
      - --providers.docker.network=openclaw-net
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      # Wildcard cert qua Cloudflare DNS challenge
      - --certificatesresolvers.cf.acme.dnschallenge=true
      - --certificatesresolvers.cf.acme.dnschallenge.provider=cloudflare
      - --certificatesresolvers.cf.acme.dnschallenge.resolvers=1.1.1.1:53
      - --certificatesresolvers.cf.acme.email=admin@openclaw.ai
      - --certificatesresolvers.cf.acme.storage=/certs/acme.json
      # Dashboard: tắt hoặc bind localhost
      - --api=false
    environment:
      CF_DNS_API_TOKEN: ${CLOUDFLARE_API_TOKEN}   # Zone:DNS:Edit permission
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /opt/traefik/certs:/certs
    networks:
      - openclaw-net
    restart: unless-stopped

networks:
  openclaw-net:
    external: true
```

```bash
cd /opt/traefik
touch certs/acme.json && chmod 600 certs/acme.json
docker compose up -d
```

**Cloudflare DNS:**
- `A` record: `*.openclaw.ai` → VPS IP, Proxy: **ON** (ẩn VPS IP thật)
- `A` record: `app.openclaw.ai` → Cloudflare Pages (tự động)
- `CNAME`: `api.openclaw.ai` → Railway domain

---

## 5. Redis — Setup trên VPS (MVP)

```yaml
# /opt/redis/docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - openclaw-net
    restart: unless-stopped
    # KHÔNG expose port ra ngoài — chỉ internal network

volumes:
  redis-data:

networks:
  openclaw-net:
    external: true
```

**REDIS_URL cho worker:** `redis://default:${REDIS_PASSWORD}@redis:6379`

**Khi chuyển sang Railway managed Redis (multi-VPS):**
```bash
# Chỉ đổi env var, không thay đổi code gì
REDIS_URL=redis://default:password@railway-redis.railway.internal:6379
docker compose restart worker
```

---

## 6. openclaw-worker — BullMQ Consumer

```typescript
// worker/container.processor.ts
@Processor('container-ops', { concurrency: 5 })
export class ContainerProcessor {

  @Process('spawn')
  async spawn(job: Job) {
    const { projectId, userId, subdomain, plan } = job.data;

    // Resource limits theo tier
    const LIMITS = {
      free: { memory: 512  * 1024 * 1024, cpuQuota: 20_000 },  // 512MB, 0.2 vCPU
      pro:  { memory: 2048 * 1024 * 1024, cpuQuota: 100_000 }, // 2GB,   1.0 vCPU
    };
    const { memory, cpuQuota } = LIMITS[plan] ?? LIMITS.free;

    // Tạo thư mục volume
    await fs.mkdir(`/data/users/${userId}`, { recursive: true });

    const container = await this.docker.createContainer({
      Image: 'openclaw-gateway:latest',
      name: `openclaw-${userId}`,
      HostConfig: {
        Memory:    memory,
        CpuQuota:  cpuQuota,   // cpuPeriod default = 100_000 → quota/period = vCPU fraction
        Binds: [`/data/users/${userId}:/app/data`],
        NetworkMode: 'openclaw-net',
        RestartPolicy: { Name: 'no' }, // QUAN TRỌNG: Control Plane quản lý lifecycle
      },
      Env: [
        `OPENCLAW_PLAN=${plan}`,           // container tự disable heavy tools nếu free
        `OPENCLAW_USER_ID=${userId}`,
      ],
      Labels: {
        'traefik.enable': 'true',
        [`traefik.http.routers.${userId}.rule`]: `Host(\`${subdomain}.openclaw.ai\`)`,
        [`traefik.http.routers.${userId}.tls.certresolver`]: 'cf',
        [`traefik.http.routers.${userId}.entrypoints`]: 'websecure',
        [`traefik.http.services.${userId}.loadbalancer.server.port`]: '3000',
        'openclaw.userId': userId,
        'openclaw.projectId': projectId,
        'openclaw.plan': plan,
      },
    });

    await container.start();
    await this.waitHealthy(`openclaw-${userId}`, { timeoutMs: 30_000 });
    await this.notifyControlPlane(projectId, 'running', `openclaw-${userId}`);
  }

  @Process('stop')
  async stop(job: Job) {
    const { projectId, userId } = job.data;
    const container = this.docker.getContainer(`openclaw-${userId}`);
    await container.stop({ t: 10 }); // SIGTERM → 10s → SIGKILL
    await this.notifyControlPlane(projectId, 'stopped');
  }

  @Process('wake')
  async wake(job: Job) {
    const { projectId, userId } = job.data;
    const container = this.docker.getContainer(`openclaw-${userId}`);
    await container.start();
    await this.waitHealthy(`openclaw-${userId}`, { timeoutMs: 20_000 });
    await this.notifyControlPlane(projectId, 'running');
  }

  @Process('destroy')
  async destroy(job: Job) {
    const { projectId, userId } = job.data;
    const container = this.docker.getContainer(`openclaw-${userId}`);
    try { await container.stop({ t: 5 }); } catch {}
    await container.remove({ force: true });
    await fs.rm(`/data/users/${userId}`, { recursive: true });
    await this.notifyControlPlane(projectId, 'destroyed');
  }

  private async waitHealthy(name: string, opts: { timeoutMs: number }) {
    const deadline = Date.now() + opts.timeoutMs;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`http://${name}:3000/health`);
        if (res.ok) return;
      } catch {}
      await new Promise(r => setTimeout(r, 2_000));
    }
    throw new Error(`Container ${name} health check timeout`);
  }

  private async notifyControlPlane(projectId: string, status: string, containerName?: string) {
    await fetch(`${process.env.CONTROL_PLANE_URL}/api/internal/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VPS_WORKER_SECRET}`,
      },
      body: JSON.stringify({ projectId, status, containerName }),
    });
  }
}
```

### restart: no — lý do quan trọng
Container bị `docker stop` (idle shutdown) sẽ không tự khởi động lại. Nếu dùng `unless-stopped`, idle-shutdown bị bypass sau VPS reboot. Control Plane là nơi duy nhất quyết định khi nào container chạy.

---

## 7. Auto Wake — Traefik Transparent (V2)

Khi cần UX tốt hơn (không phải bấm nút "Khởi động" trên dashboard):

```yaml
# /opt/wake-proxy/docker-compose.yml
services:
  wake-proxy:
    image: openclaw-wake-proxy:latest   # ~50 dòng Node.js/Go
    environment:
      CONTROL_PLANE_URL: https://api.openclaw.ai
      VPS_WORKER_SECRET: ${VPS_WORKER_SECRET}
    networks:
      - openclaw-net
    labels:
      # Wake proxy nhận tất cả *.openclaw.ai requests khi container chính không có
      # Priority thấp hơn container thật → container thật được ưu tiên
      traefik.enable: "true"
      traefik.http.routers.wake-proxy.rule: "HostRegexp(`{sub:[a-z0-9]+}.openclaw.ai`)"
      traefik.http.routers.wake-proxy.priority: "1"       # thấp nhất
      traefik.http.routers.wake-proxy.entrypoints: "websecure"
      traefik.http.services.wake-proxy.loadbalancer.server.port: "8080"
    restart: unless-stopped
```

**Logic wake-proxy (~50 dòng):**
```
Nhận request → Host: {userId}.openclaw.ai
  → Gọi POST api.openclaw.ai/api/internal/wake/{userId}
  → Trả HTML loading page (spinner + auto-refresh 3s)
  → Sau container healthy, Traefik route đến container (priority cao hơn wake-proxy)
  → Request tiếp theo pass-through, không đi qua wake-proxy nữa
```

**Traefik routing priority:**
- Container user: priority default (1000) — được ưu tiên khi running
- wake-proxy: priority 1 — chỉ nhận khi không có container nào match

---

## 8. Xử lý VPS Reboot

Containers có `restart: no` sẽ không tự start sau reboot. Worker xử lý bằng startup script:

```typescript
// worker onApplicationBootstrap
async onApplicationBootstrap() {
  // Query Control Plane để biết containers nào đang "running" trong DB
  const running = await this.getRunningFromDB();

  for (const project of running) {
    const name = `openclaw-${project.userId}`;
    const containerInfo = await this.docker.getContainer(name).inspect().catch(() => null);

    if (!containerInfo) {
      // Container bị mất (VPS format?) → spawn lại
      await this.jobsProducer.enqueueSpawn(project.id, project.userId, project.subdomain);
    } else if (containerInfo.State.Status !== 'running') {
      // Container tồn tại nhưng stopped → start lại
      await this.docker.getContainer(name).start();
    }
  }
}
```

---

## 9. Persistent Storage & Backup

```
/data/users/{userId}/
  ├── openclaw.db        ← SQLite: messages, tasks, history
  ├── config.json        ← AES-256: bot tokens, API keys
  ├── logs/
  │   ├── gateway.log    ← logrotate 7 ngày, max 50MB
  │   └── audit.log      ← logrotate 90 ngày
  └── backups/
      └── YYYY-MM-DD.tar.gz
```

```bash
# /etc/cron.d/openclaw-backup
# Backup SQLite + config mỗi đêm 3h
0 3 * * * openclaw find /data/users -maxdepth 1 -mindepth 1 -type d \
  -exec sh -c 'tar czf "$1/backups/$(date +%Y-%m-%d).tar.gz" \
  --exclude="$1/backups" "$1/openclaw.db" "$1/config.json" 2>/dev/null' _ {} \;

# Giữ 7 bản gần nhất
0 4 * * * openclaw find /data/users/*/backups -name "*.tar.gz" -mtime +7 -delete
```

**logrotate config:**
```
# /etc/logrotate.d/openclaw
/data/users/*/logs/gateway.log {
  daily
  rotate 7
  compress
  missingok
  notifempty
}
```

---

## 10. Monitoring

```bash
# Netdata — real-time metrics, ~50MB RAM, free
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Chỉ bind localhost: chỉnh /etc/netdata/netdata.conf → bind to = 127.0.0.1
# Truy cập qua SSH tunnel: ssh -L 19999:localhost:19999 user@vps

# UptimeRobot (free tier): ping https://app.openclaw.ai mỗi 5 phút
```

```bash
# /opt/scripts/alert-ram.sh — cron mỗi 5 phút
#!/bin/bash
USED=$(free | awk '/Mem/{printf "%.0f", $3/$2*100}')
[ "$USED" -gt 85 ] && curl -s -X POST "$ALERT_WEBHOOK" \
  -d "{\"text\":\"⚠️ VPS RAM ${USED}% — cần scale hoặc tăng idle aggressiveness\"}"
```

---

## 11. Scale Path — Thêm VPS

### Bước 1: Chuẩn bị Control Plane (Railway)
```sql
-- Đã có vps_id trong bảng projects (nullable = VPS #1)
-- Thêm bảng vps_nodes
CREATE TABLE vps_nodes (
  id         VARCHAR(20) PRIMARY KEY,  -- 'vps-1', 'vps-2'
  ip         INET NOT NULL,
  capacity   INT  DEFAULT 80,          -- max containers
  active     BOOL DEFAULT true
);
```

### Bước 2: Node selector trong API
```typescript
async selectVps(): Promise<string> {
  const nodes = await this.vpsNodesRepo.find({ where: { active: true } });
  const capacities = await Promise.all(nodes.map(async n => ({
    id: n.id,
    used: await this.projectsRepo.count({ where: { vpsId: n.id, status: 'running' } }),
    max: n.capacity,
  })));
  const available = capacities.filter(n => n.used < n.max * 0.85);
  if (!available.length) throw new Error('No VPS capacity available');
  return available.sort((a, b) => (a.used / a.max) - (b.used / b.max))[0].id;
}
```

### Bước 3: Redis
- Đổi `REDIS_URL` trên tất cả workers → Railway managed Redis
- Workers ở VPS-1 và VPS-2 cùng consume từ 1 queue

### Bước 4: DNS
- `*.openclaw.ai` vẫn trỏ đến 1 VPS (vấn đề khi multi-VPS)
- Giải pháp: mỗi VPS có subdomain riêng: `*.vps1.openclaw.ai`, `*.vps2.openclaw.ai`
- Hoặc dùng Cloudflare Load Balancer ($5/tháng) để route theo origin

---

## 12. Security Checklist

- [ ] UFW chỉ mở 22, 80, 443
- [ ] SSH key only, password auth disabled
- [ ] Docker socket: chỉ user `openclaw` (group docker)
- [ ] Redis: không expose port ra ngoài VPS, password required
- [ ] Traefik dashboard: tắt (`--api=false`)
- [ ] Cloudflare Proxy ON cho `*.openclaw.ai` — ẩn VPS IP
- [ ] `/data/users` permission 700, owned by `openclaw`
- [ ] Backup cron active
- [ ] unattended-upgrades: `apt install unattended-upgrades -y`
- [ ] `VPS_WORKER_SECRET` không commit vào git, lưu trong env file 600 permission

---

## 13. VPS riêng cho Pro tier (khi scale)

Mỗi pro container dùng 1 vCPU → 12 pro users đồng thời = hết CPU VPS. Khi có >20 pro users active, tách VPS riêng:

```
VPS-free:  Chỉ free containers (512MB / 0.2 vCPU)
           → ~50 active đồng thời, ~330 users
VPS-pro:   Chỉ pro containers  (2GB / 1.0 vCPU)
           → ~10 active đồng thời, ~50 users
```

**Lợi:** FFmpeg/Playwright của pro users không làm lag free users. Dễ scale từng tier độc lập.

**Cách implement:** Thêm field `tier` vào `vps_nodes` table, node selector chọn đúng VPS theo plan.

---

## 14. Không làm cho MVP

| Feature | Khi nào |
|---|---|
| Traefik transparent wake (wake-proxy) | Khi user phàn nàn về UX |
| Dedicated Redis VPS + Sentinel | Khi >10,000 users |
| VPS riêng cho Pro tier | Khi >20 pro users active |
| Multi-VPS node selector | Khi thêm VPS thứ 2 |
| Container resource monitoring per user | Ngay khi launch pro tier (billing by usage) |
| Log streaming real-time | Sprint 2 |
| GPU node | Khi cần local AI inference |
