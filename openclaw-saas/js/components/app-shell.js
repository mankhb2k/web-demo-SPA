/**
 * app-shell.js — Root component.
 *
 * Quản lý toàn bộ state: users, logs, tab, cmdUser.
 * Render: header (tab nav) + sidebar (server stats + event log) + main (tab outlet).
 *
 * Giao tiếp với tabs qua custom events (bubbles + composed):
 *   register-user, add-instance, toggle-instance, remove-instance, remove-user, set-cmd-user
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { uid, now, clamp, TABS } from '../helpers.js';

/* Import tất cả tab components để đăng ký custom elements */
import './tab-dashboard.js';
import './tab-architecture.js';
import './tab-storage.js';
import './tab-compare.js';
import './tab-docker101.js';

class AppShell extends LitElement {
  static properties = {
    _users:   { state: true },
    _logs:    { state: true },
    _tab:     { state: true },
    _cmdUser: { state: true },
  };

  static styles = css`
    :host { display: block; }

    /* ── App layout ── */
    .app    { min-height: 100vh; display: flex; flex-direction: column; }
    .body   { display: grid; grid-template-columns: 280px 1fr; flex: 1; min-height: 0; }
    @media (max-width: 840px) { .body { grid-template-columns: 1fr; } }

    /* ── Header ── */
    .header {
      background: #0b1628; border-bottom: 1px solid #1a2d46;
      padding: .75rem 1.5rem; display: flex; align-items: center;
      gap: 1rem; flex-wrap: wrap; position: sticky; top: 0; z-index: 10;
    }
    .logo-wrap { display: flex; align-items: center; gap: .6rem; }
    .logo-text {
      font-size: 1.1rem; font-weight: 800; letter-spacing: -.02em;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .logo-sub { font-size: .7rem; color: #475569; margin-top: -.1rem; }

    /* Tab nav */
    .tabs { display: flex; gap: .25rem; flex-wrap: wrap; margin-left: auto; }
    .tab-btn {
      padding: .4rem .85rem; border-radius: 8px; border: none;
      background: transparent; color: #64748b; cursor: pointer;
      font-size: .8rem; font-weight: 600; transition: all .15s; font-family: inherit;
    }
    .tab-btn:hover  { background: #1a2d46; color: #94a3b8; }
    .tab-btn.active { background: #1d3a6e; color: #7dd3fc; }

    /* ── Sidebar ── */
    .sidebar {
      background: #0b1628; border-right: 1px solid #1a2d46;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem;
      overflow-y: auto;
    }
    .panel {
      background: #0f1f38; border: 1px solid #1a2d46; border-radius: 12px; padding: 1rem;
    }
    .panel-title {
      font-size: .65rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: .1em; color: #475569; margin-bottom: .75rem;
      display: flex; align-items: center; gap: .4rem;
    }

    /* Resource bars */
    .stat-row  { display: flex; justify-content: space-between; font-size: .75rem; margin-bottom: .3rem; }
    .bar-track { background: #0c1a2e; border-radius: 99px; height: 6px; overflow: hidden; margin-bottom: .75rem; }
    .bar-fill  { height: 100%; border-radius: 99px; transition: width .6s ease; }
    .bar-blue  { background: linear-gradient(90deg, #2563eb, #38bdf8); }
    .bar-green { background: linear-gradient(90deg, #16a34a, #4ade80); }
    .bar-red   { background: linear-gradient(90deg, #dc2626, #f87171); }

    /* Metric tiles */
    .metrics     { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-bottom: .75rem; }
    .metric      { background: #0c1a2e; border-radius: 8px; padding: .5rem .6rem; border: 1px solid #1a2d46; }
    .metric-val  { font-size: 1.2rem; font-weight: 800; line-height: 1; }
    .metric-name { font-size: .6rem; color: #475569; text-transform: uppercase; margin-top: .2rem; }

    /* Add user button */
    .btn-primary {
      width: 100%; padding: .65rem; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #1d4ed8, #6366f1);
      color: #fff; font-weight: 700; font-size: .85rem; cursor: pointer;
      transition: all .15s; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: .4rem;
    }
    .btn-primary:hover  { filter: brightness(1.15); transform: translateY(-1px); }
    .btn-primary:active { transform: translateY(0);  filter: brightness(.95); }

    /* Image info */
    .img-info { font-family: 'Cascadia Code','Fira Code','Consolas',monospace; font-size: .72rem; line-height: 1.9; }

    /* Event log */
    .log-box {
      background: #060d1a; border-radius: 8px; padding: .6rem;
      height: 140px; overflow-y: auto;
      display: flex; flex-direction: column; gap: .25rem;
    }
    .log-entry { font-size: .68rem; font-family: 'Cascadia Code','Fira Code','Consolas',monospace; color: #475569; }
    .log-entry.fresh { color: #60a5fa; }
    .log-time  { opacity: .4; margin-right: .4rem; }

    /* ── Main area ── */
    .main { padding: 1.25rem; overflow-y: auto; }
  `;

  constructor() {
    super();
    this._users   = [];
    this._logs    = [{ t: now(), msg: 'Docker Engine sẵn sàng. OpenClaw SaaS online.' }];
    this._tab     = 'dashboard';
    this._cmdUser = null;
  }

  /* ════════════════ State helpers ════════════════ */
  _log(msg) {
    this._logs = [{ t: now(), msg }, ...this._logs].slice(0, 20);
  }

  get _totalRAM()        { return this._users.reduce((s,u) => s + u.instances.reduce((ss,i) => ss+i.memory, 0), 0); }
  get _totalCPU()        { return this._users.reduce((s,u) => s + u.instances.reduce((ss,i) => ss+i.cpu,    0), 0); }
  get _totalContainers() { return this._users.reduce((s,u) => s + u.instances.length, 0); }
  get _runningCtr()      { return this._users.reduce((s,u) => s + u.instances.filter(i=>i.status==='running').length, 0); }

  /* ════════════════ Actions ════════════════ */
  _registerUser() {
    const id    = 'usr_' + uid();
    const port  = 8000 + Math.floor(Math.random() * 1000);
    const insId = `${id}_bot_1`;
    this._users = [...this._users, {
      id, createdAt: now(),
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
    const PLATFORMS = ['Telegram','Zalo','WhatsApp','Discord','Slack','IRC','LINE'];
    const used  = user.instances.map(i => i.type);
    const type  = PLATFORMS.find(p => !used.includes(p)) ?? 'Bot';
    const insId = `${userId}_bot_${user.instances.length + 1}`;
    const port  = 9000 + Math.floor(Math.random() * 500);
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
    if (type === 'register-user')   this._registerUser();
    if (type === 'add-instance')    this._addInstance(detail.userId);
    if (type === 'toggle-instance') this._toggleInstance(detail.userId, detail.insId);
    if (type === 'remove-instance') this._removeInstance(detail.userId, detail.insId);
    if (type === 'remove-user')     this._removeUser(detail.userId);
    if (type === 'set-cmd-user')    this._cmdUser = detail.userId;
  }

  /* ════════════════ Render ════════════════ */
  render() {
    const ram    = this._totalRAM;
    const cpu    = this._totalCPU;
    const ramPct = clamp((ram / 8192) * 100, 0, 100);
    const cpuPct = clamp(cpu, 0, 100);
    const ramBar = ramPct > 75 ? 'bar-red' : 'bar-blue';

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
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#1d4ed8"/>
              <rect x="5"    y="10" width="5" height="5" rx="1.5" fill="#60a5fa"/>
              <rect x="11.5" y="10" width="5" height="5" rx="1.5" fill="#60a5fa"/>
              <rect x="18"   y="10" width="5" height="5" rx="1.5" fill="#60a5fa"/>
              <rect x="5"    y="17" width="5" height="5" rx="1.5" fill="#93c5fd"/>
              <rect x="11.5" y="17" width="5" height="5" rx="1.5" fill="#93c5fd"/>
              <path d="M20 14h5" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
            </svg>
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
              >${t.label}</button>
            `)}
          </nav>
        </header>

        <!-- ── Body ── -->
        <div class="body">

          <!-- Sidebar -->
          <aside class="sidebar">

            <!-- Server metrics + Add User -->
            <div class="panel">
              <div class="panel-title"><span>⚙</span> Host Server (VPS)</div>
              <div class="stat-row">
                <span>RAM (${ram} MB / 8192 MB)</span>
                <span style="color:${ramPct>75?'#f87171':'#60a5fa'}">${ramPct.toFixed(1)}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill ${ramBar}" style="width:${ramPct}%"></div>
              </div>
              <div class="stat-row">
                <span>CPU Load</span>
                <span style="color:#4ade80">${cpuPct}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill bar-green" style="width:${cpuPct}%"></div>
              </div>
              <div class="metrics">
                <div class="metric">
                  <div class="metric-val" style="color:#60a5fa">${this._totalContainers}</div>
                  <div class="metric-name">Containers</div>
                </div>
                <div class="metric">
                  <div class="metric-val" style="color:#4ade80">${this._runningCtr}</div>
                  <div class="metric-name">Running</div>
                </div>
                <div class="metric">
                  <div class="metric-val" style="color:#a78bfa">${this._users.length}</div>
                  <div class="metric-name">Users</div>
                </div>
                <div class="metric">
                  <div class="metric-val" style="color:#fbbf24">${this._totalContainers - this._runningCtr}</div>
                  <div class="metric-name">Sleeping</div>
                </div>
              </div>
              <button class="btn-primary" @click=${this._registerUser}>
                <span>＋</span> Đăng ký User mới
              </button>
            </div>

            <!-- Image info -->
            <div class="panel">
              <div class="panel-title"><span>📦</span> Docker Image</div>
              <div class="img-info">
                <div style="color:#c084fc">openclaw-gateway:v2</div>
                <div style="color:#475569;padding-left:.8rem">BASE: node:20-alpine</div>
                <div style="color:#475569;padding-left:.8rem">SIZE: ~48 MB</div>
                <div style="color:#475569;padding-left:.8rem">CMD : ["node","gateway.js"]</div>
              </div>
            </div>

            <!-- Event log -->
            <div class="panel" style="flex:1">
              <div class="panel-title"><span>📋</span> Docker Events</div>
              <div class="log-box">
                ${this._logs.map((l, i) => html`
                  <div class="log-entry ${i===0?'fresh':''}">
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
      </div>
    `;
  }
}

customElements.define('app-shell', AppShell);
