/**
 * tab-docker101.js
 * Tab 5: Docker 101 — khái niệm cốt lõi + giải thích docker run flags.
 * Static content — không cần props.
 */
import { LitElement, html } from 'https://esm.sh/lit@3';

class TabDocker101 extends LitElement {
  createRenderRoot() { return this; }


  static _CONCEPTS = [
    {
      icon: 'package', title: 'Docker Image', border: '#1d4ed850',
      body: html`
        Giống như file <strong>.ISO</strong> — bản thiết kế blueprint.
        Chứa code, runtime, dependencies. Image là <strong>Read-only</strong> —
        không thay đổi dù chạy bao nhiêu container.<br><br>
        <span class="concept-mono">docker pull openclaw-gateway:v2</span><br>
        <span class="concept-mono">docker images</span>
      `,
    },
    {
      icon: 'rocket', title: 'Docker Container', border: '#16a34a50',
      body: html`
        "Chạy" Image → tạo Container — <strong>instance</strong> thực đang hoạt động.
        Mỗi container có writable layer riêng trên image (copy-on-write).<br><br>
        <strong>1 Image → N Containers</strong> (mỗi user 1 container, cùng code)<br><br>
        <span class="concept-mono">docker ps -a</span>
      `,
    },
    {
      icon: 'database', title: 'Volume (Lưu trữ)', border: '#d9770650',
      body: html`
        Data trong container là <strong>ephemeral</strong> — xóa container = mất data.
        Volume mount thư mục Host vào container, data tồn tại độc lập với lifecycle.<br><br>
        <span class="concept-mono">-v /host/path:/container/path</span>
      `,
    },
    {
      icon: 'network', title: 'Network Isolation', border: '#7c3aed50',
      body: html`
        Mỗi container chạy trong <strong>bridge network</strong> riêng. Container
        không nói chuyện với nhau trừ khi được phép. Port chỉ expose về localhost —
        Nginx làm reverse proxy ra ngoài.<br><br>
        <span class="concept-mono">--network openclaw-net</span>
      `,
    },
    {
      icon: 'settings-2', title: 'Resource Limits', border: '#0891b250',
      body: html`
        Giới hạn CPU/RAM tránh <strong>noisy-neighbor</strong>:
        1 user không chiếm hết tài nguyên server, không làm chậm user khác.<br><br>
        <span class="concept-mono">--memory="256m"</span><br>
        <span class="concept-mono">--cpus="0.5"</span>
      `,
    },
    {
      icon: 'refresh-cw', title: 'Sleep / Wake Pattern', border: '#dc262650',
      body: html`
        Free tier dừng container sau idle. Volume giữ toàn bộ data.
        Khi user quay lại, container start lại trong vài giây,
        mount cùng volume → <strong>không mất gì</strong>.<br><br>
        <span class="concept-mono">docker stop / docker start</span>
      `,
    },
  ];

  static _FLAGS = [
    ['-d',              'Detached — container chạy nền, terminal không bị block'],
    ['--memory',        'Hard limit RAM. Vượt quá → OOM-killed, user khác hoàn toàn an toàn'],
    ['--cpus',          'Cgroup CPU quota. 0.5 = 50% của 1 vCPU. Không ảnh hưởng container khác'],
    ['-v host:ctr',     'Bind mount. Thư mục host xuất hiện tại đường dẫn bên trong container'],
    ['-p 127.0.0.1:X',  'Chỉ expose port về localhost. Nginx proxy từ ngoài vào — bảo mật hơn 0.0.0.0'],
    ['-e KEY=VAL',      'Environment variable. Cách truyền config vào container (12-factor app)'],
    ['--restart',       'Policy: no / on-failure / always / unless-stopped → dùng unless-stopped'],
    ['--network',       'Đặt container vào custom bridge network. Cô lập với container khác'],
    ['--read-only',     'Filesystem read-only — ngăn malicious code ghi vào image layer'],
    ['--tmpfs /tmp',    '/tmp ghi được (in-memory). Cần cho nhiều runtime, không persist'],
  ];

  render() {
    return html`
      <div class="anim-slide">
        <div class="section-title">
          <iconify-icon icon="logos:docker-icon" style="margin-right: .6rem; font-size: 1.2rem;"></iconify-icon>
          Docker 101 — Kiến thức cốt lõi
        </div>

        <!-- Dockerfile → Image → Container flow -->
        <div class="flow-visual">
          <div class="flow-box fb-file">Dockerfile</div>
          <div class="flow-arrow">→</div>
          <div class="flow-box fb-cmd">docker build</div>
          <div class="flow-arrow">→</div>
          <div class="flow-box fb-img"><iconify-icon icon="lucide:package" style="margin-bottom:.2rem"></iconify-icon> Image<div style="font-size:.62rem;opacity:.6">Read-only</div></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box fb-cmd">docker run</div>
          <div class="flow-arrow">→</div>
          <div class="flow-box fb-ctr"><iconify-icon icon="lucide:box" style="margin-bottom:.2rem"></iconify-icon> Container<div style="font-size:.62rem;opacity:.6">Running</div></div>
          <div class="flow-arrow">×N</div>
          <div class="flow-box fb-ctr" style="opacity:.5"><iconify-icon icon="lucide:box" style="margin-bottom:.2rem"></iconify-icon> Container<div style="font-size:.62rem;opacity:.6">More instances</div></div>
        </div>

        <!-- Concept cards -->
        <div class="concept-grid">
          ${TabDocker101._CONCEPTS.map(c => html`
            <div class="concept-card" style="border-color:${c.border}">
              <div class="concept-icon">
                <iconify-icon icon="lucide:${c.icon}"></iconify-icon>
              </div>
              <div class="concept-title">${c.title}</div>
              <div class="concept-body">${c.body}</div>
            </div>
          `)}
        </div>

        <!-- Docker run annotated -->
        <div class="section-title" style="font-size:.9rem">
          <iconify-icon icon="lucide:search" style="margin-right: .5rem; color: #60a5fa;"></iconify-icon>
          Giải thích từng flag trong lệnh docker run
        </div>
        <div class="cmd-builder">
          <div class="cmd-builder-title">
            <iconify-icon icon="lucide:terminal" style="margin-right: .4rem;"></iconify-icon>
            Lệnh thực tế OpenClaw SaaS dùng
          </div>
          <code class="cmd-line"
><span class="c-blue">docker run</span> <span class="c-blue">-d</span>                           <span class="c-gray"># detached mode (chạy nền)</span>
  <span class="c-blue">--name</span>      <span class="c-white">openclaw-usr_abc1</span>          <span class="c-gray"># tên container duy nhất per user</span>
  <span class="c-blue">--memory</span>    <span class="c-white">"256m"</span>                    <span class="c-gray"># giới hạn RAM 256 MB</span>
  <span class="c-blue">--memory-swap</span> <span class="c-white">"256m"</span>                  <span class="c-gray"># tắt swap</span>
  <span class="c-blue">--cpus</span>      <span class="c-white">"0.5"</span>                    <span class="c-gray"># tối đa 0.5 vCPU</span>
  <span class="c-yellow">-v</span>          <span class="c-yellow">/data/users/usr_abc1:/app/data</span> <span class="c-gray"># volume mount</span>
  <span class="c-blue">-p</span>          <span class="c-white">127.0.0.1:8342:3000</span>       <span class="c-gray"># expose nội bộ → Nginx proxy</span>
  <span class="c-green">-e</span>          <span class="c-green">USER_ID=usr_abc1</span>           <span class="c-gray"># env var</span>
  <span class="c-green">-e</span>          <span class="c-green">NODE_ENV=production</span>
  <span class="c-blue">--restart</span>   <span class="c-white">unless-stopped</span>            <span class="c-gray"># auto-restart nếu crash</span>
  <span class="c-blue">--network</span>   <span class="c-white">openclaw-net</span>              <span class="c-gray"># bridge network cách ly</span>
  <span class="c-blue">--read-only</span>                            <span class="c-gray"># filesystem read-only</span>
  <span class="c-blue">--tmpfs</span>     <span class="c-white">/tmp</span>                      <span class="c-gray"># /tmp ghi được (in-memory)</span>
  <span class="c-purple">openclaw-gateway:v2</span>                    <span class="c-gray"># image:tag</span></code>
        </div>

        <!-- Flag annotations -->
        <div class="annotations">
          ${TabDocker101._FLAGS.map(([flag, desc]) => html`
            <div class="ann">
              <span class="ann-key">${flag}</span>
              <span>${desc}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('tab-docker101', TabDocker101);
