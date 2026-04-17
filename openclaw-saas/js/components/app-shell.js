/**
 * app-shell.js — Root component.
 *
 * Quản lý toàn bộ state: users, logs, tab, cmdUser.
 * Render: header (tab nav) + sidebar (server stats + event log) + main (tab outlet).
 *
 * Giao tiếp với tabs qua custom events (bubbles + composed):
 *   register-user, add-instance, toggle-instance, remove-instance, remove-user, set-cmd-user
 */
import { LitElement, html } from 'https://esm.sh/lit@3';
import { uid, now, clamp, TABS } from '../helpers.js';

/* Import tất cả tab components để đăng ký custom elements */
import './tab-dashboard.js';
import './tab-architecture.js';
import './tab-flows.js';
import './tab-database.js';
import './tab-storage.js';
import './tab-compare.js';
import './tab-docker101.js';

class AppShell extends LitElement {
  static properties = {
    _users: { state: true },
    _logs: { state: true },
    _tab: { state: true },
    _cmdUser: { state: true },
    _cpuJitter: { state: true },
    _uptime: { state: true },
  };

  createRenderRoot() { return this; }


  constructor() {
    super();
    this._users = [];
    this._logs = [{ t: now(), msg: 'Docker Engine sẵn sàng. OpenClaw SaaS online.' }];
    this._tab = 'dashboard';
    this._cmdUser = null;
    this._cpuJitter = 2;
    this._uptime = 0;
  }

  connectedCallback() {
    super.connectedCallback();
    // Live CPU jitter every 2s
    this._cpuInterval = setInterval(() => {
      const base = this._totalCPU;
      this._cpuJitter = base + (Math.random() * 2 - 1) * 1.5;
    }, 2000);
    // Uptime counter every second
    this._uptimeInterval = setInterval(() => {
      this._uptime++;
    }, 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._cpuInterval);
    clearInterval(this._uptimeInterval);
  }

  /* ════════════════ State helpers ════════════════ */
  _log(msg) {
    this._logs = [{ t: now(), msg }, ...this._logs].slice(0, 20);
  }

  get _totalRAM() { return this._users.reduce((s, u) => s + u.instances.reduce((ss, i) => ss + i.memory, 0), 0); }
  get _totalCPU() { return this._users.reduce((s, u) => s + u.instances.reduce((ss, i) => ss + i.cpu, 0), 0); }
  get _totalContainers() { return this._users.reduce((s, u) => s + u.instances.length, 0); }
  get _runningCtr() { return this._users.reduce((s, u) => s + u.instances.filter(i => i.status === 'running').length, 0); }

  /* ════════════════ Actions ════════════════ */
  _registerUser() {
    const id = 'usr_' + uid();
    const port = 8000 + Math.floor(Math.random() * 1000);
    const insId = `${id}_bot_1`;
    this._users = [...this._users, {
      id, createdAt: now(), tier: 'Free',
      instances: [{ id: insId, type: 'Telegram', status: 'provisioning', memory: 0, cpu: 0, port }],
    }];
    this._log(`Provisioning [openclaw-${id}]... Image: openclaw-gateway:v2`);
    setTimeout(() => {
      this._users = this._users.map(u => u.id !== id ? u : {
        ...u,
        instances: u.instances.map(i => i.id !== insId ? i : { ...i, status: 'running', memory: 128, cpu: 4 }),
      });
      this._log(`Container [openclaw-${id}] ready on port :${port}`);
    }, 1600);
  }

  _addInstance(userId) {
    const user = this._users.find(u => u.id === userId);
    if (!user) return;

    if (user.tier === 'Free' && user.instances.length >= 2) {
      this._log(`[Cảnh báo] Free tier (User ${userId}) giới hạn tối đa 2 containers!`);
      return;
    }

    const PLATFORMS = ['Telegram', 'Zalo', 'WhatsApp', 'Discord', 'Slack', 'IRC', 'LINE'];
    const used = user.instances.map(i => i.type);
    const type = PLATFORMS.find(p => !used.includes(p)) ?? 'Bot';
    const insId = `${userId}_bot_${user.instances.length + 1}`;
    const port = 9000 + Math.floor(Math.random() * 500);
    this._users = this._users.map(u => u.id !== userId ? u : {
      ...u,
      instances: [...u.instances, { id: insId, type, status: 'provisioning', memory: 0, cpu: 0, port }],
    });
    this._log(`Khởi tạo instance [${insId}] cho ${type}...`);
    setTimeout(() => {
      this._users = this._users.map(u => u.id !== userId ? u : {
        ...u,
        instances: u.instances.map(i => i.id !== insId ? i : { ...i, status: 'running', memory: 96, cpu: 3 }),
      });
      this._log(`[${insId}] (${type}) đang chạy.`);
    }, 1200);
  }

  _toggleInstance(userId, insId) {
    this._users = this._users.map(u => u.id !== userId ? u : {
      ...u,
      instances: u.instances.map(i => {
        if (i.id !== insId) return i;
        const running = i.status === 'running';
        this._log(running
          ? `Dừng [${insId}] → giải phóng ${i.memory}MB RAM (Volume an toàn)`
          : `Khởi động [${insId}] → load SQLite từ Volume`);
        return { ...i, status: running ? 'stopped' : 'running', memory: running ? 0 : 128, cpu: running ? 0 : 4 };
      }),
    });
  }

  _removeInstance(userId, insId) {
    this._users = this._users.map(u => u.id !== userId ? u : {
      ...u, instances: u.instances.filter(i => i.id !== insId),
    });
    this._log(`Đã xóa container [${insId}]`);
  }

  _removeUser(userId) {
    this._users = this._users.filter(u => u.id !== userId);
    if (this._cmdUser === userId) this._cmdUser = null;
    this._log(`Đã xóa account + volume: /data/users/${userId}/`);
  }

  /* ════════════════ Event listeners (from child tabs) ════════════════ */
  _onEvent(e) {
    const { type, detail } = e;
    if (type === 'register-user') this._registerUser();
    if (type === 'add-instance') this._addInstance(detail.userId);
    if (type === 'toggle-instance') this._toggleInstance(detail.userId, detail.insId);
    if (type === 'remove-instance') this._removeInstance(detail.userId, detail.insId);
    if (type === 'remove-user') this._removeUser(detail.userId);
    if (type === 'set-cmd-user') this._cmdUser = detail.userId;
  }

  /* ════════════════ Render ════════════════ */
  render() {
    const ram = this._totalRAM;
    const cpu = this._totalCPU;
    const ramPct = clamp((ram / 18432) * 100, 0, 100);
    const cpuPct = clamp(cpu, 0, 100);
    const ramBar = ramPct > 80 ? 'bar-red' : 'bar-blue';

    return html`
      <div class="app"
        @register-user=${this._onEvent}
        @add-instance=${this._onEvent}
        @toggle-instance=${this._onEvent}
        @remove-instance=${this._onEvent}
        @remove-user=${this._onEvent}
        @set-cmd-user=${this._onEvent}
      >
        <!-- ── Header ── -->
        <header class="header">
          <div class="logo-wrap">
            <iconify-icon icon="lucide:box" style="font-size: 1.6rem; color: #38bdf8;"></iconify-icon>
            <div>
              <div class="logo-text">OpenClaw SaaS</div>
              <div class="logo-sub">Docker Interactive Guide</div>
            </div>
          </div>

          <nav class="tabs">
            ${TABS.map(t => html`
              <button
                class="tab-btn ${this._tab === t.id ? 'active' : ''}"
                @click=${() => { this._tab = t.id; }}
              >
                ${t.label}
              </button>
            `)}
          </nav>
        </header>

        <!-- ── Body ── -->
        <div class="body">

          <!-- Sidebar -->
          <aside class="sidebar">

            <!-- Server metrics + Add User -->
            <div class="panel">
              <div class="panel-title">
                <iconify-icon icon="lucide:server" style="color: #60a5fa;"></iconify-icon>
                Host Server (VPS)
              </div>
              <div class="stat-row">
                <span>RAM (${ram} MB / 18432 MB)</span>
                <span style="color:${ramPct > 80 ? '#ef4444' : '#fafafa'}">${ramPct.toFixed(1)}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill ${ramBar}" style="width:${ramPct}%"></div>
              </div>
              <div class="stat-row">
                <span>CPU (12 vCPU)</span>
                <span style="color:#10b981">${clamp(this._cpuJitter, 0, 100).toFixed(1)}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill bar-green" style="width:${clamp(this._cpuJitter, 0, 100)}%"></div>
              </div>
              <div class="metrics">
                <div class="metric">
                  <div class="metric-val" style="color:#3b82f6">${this._totalContainers}</div>
                  <div class="metric-name">Containers</div>
                </div>
                <div class="metric">
                  <div class="metric-val" style="color:#22c55e">${this._runningCtr}</div>
                  <div class="metric-name">Running</div>
                </div>
                <div class="metric">
                  <div class="metric-val" style="color:#a855f7">${this._users.length}</div>
                  <div class="metric-name">Users</div>
                </div>
                <div class="metric">
                  <div class="metric-val" style="color:#eab308">${this._totalContainers - this._runningCtr}</div>
                  <div class="metric-name">Sleeping</div>
                </div>
              </div>
                <button class="btn-create" @click=${this._registerUser}>
                  <iconify-icon icon="lucide:plus"></iconify-icon>
                  Quick Create
                </button>
            </div>

            <!-- Image info -->
            <div class="panel">
              <div class="panel-title">
                <iconify-icon icon="lucide:package-2" style="color: #c084fc;"></iconify-icon>
                Docker Image
              </div>
              <div class="img-info">
                <div style="color:#c084fc">openclaw-gateway:v2</div>
                <div style="color:#475569;padding-left:.8rem">BASE: node:20-alpine</div>
                <div style="color:#475569;padding-left:.8rem">SIZE: ~48 MB</div>
                <div style="color:#475569;padding-left:.8rem">CMD : ["node","gateway.js"]</div>
              </div>
            </div>

            <!-- Event log -->
            <div class="panel" style="flex:1">
              <div class="panel-title">
                <iconify-icon icon="lucide:terminal" style="color: #475569;"></iconify-icon>
                Docker Events
              </div>
              <div class="log-box">
                ${this._logs.map((l, i) => html`
                  <div class="log-entry ${i === 0 ? 'fresh' : ''}">
                    <span class="log-time">[${l.t}]</span>${l.msg}
                  </div>
                `)}
              </div>
            </div>

          </aside>

          <!-- Main — tab outlet -->
          <main class="main">
            ${this._tab === 'dashboard' ? html`
              <tab-dashboard
                .users=${this._users}
                .cmdUser=${this._cmdUser}
              ></tab-dashboard>
            ` : ''}

            ${this._tab === 'architecture' ? html`
              <tab-architecture .users=${this._users}></tab-architecture>
            ` : ''}

            ${this._tab === 'flows' ? html`
              <tab-flows></tab-flows>
            ` : ''}

            ${this._tab === 'database' ? html`
              <tab-database .users=${this._users}></tab-database>
            ` : ''}

            ${this._tab === 'storage' ? html`
              <tab-storage .users=${this._users}></tab-storage>
            ` : ''}

            ${this._tab === 'compare' ? html`
              <tab-compare></tab-compare>
            ` : ''}

            ${this._tab === 'docker101' ? html`
              <tab-docker101></tab-docker101>
            ` : ''}
          </main>

        </div>

        <!-- ── Status Bar ── -->
        <footer class="status-bar">
          <div class="status-left">
            <span class="status-dot online"></span>
            System Online
            <span class="sep">|</span>
            Uptime: ${this._uptime}s
          </div>
          <div class="status-right">
            Region: Contabo-DE-1
            <span class="sep">|</span>
            v2.4.1-stable
          </div>
        </footer>
      </div>
    `;
  }
}

customElements.define('app-shell', AppShell);
