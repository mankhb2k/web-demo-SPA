/**
 * tab-dashboard.js
 * Tab 1: Bảng điều khiển — quản lý users & containers tương tác.
 *
 * Nhận props:  users (Array), cmdUser (String)
 * Phát events: add-instance, toggle-instance, remove-instance,
 *              remove-user, set-cmd-user  (all bubble + composed)
 */
import { LitElement, html, css, nothing } from 'https://esm.sh/lit@3';
import { sharedStyles } from '../styles/shared.js';
import { PLATFORM_EMOJI, dispatch } from '../helpers.js';

class TabDashboard extends LitElement {
  static properties = {
    users:   { type: Array },
    cmdUser: { type: String },
  };

  static styles = [sharedStyles, css`
    :host { display: block; }

    /* ── Empty state ── */
    .empty-state {
      border: 2px dashed #1a2d46; border-radius: 16px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3rem 1rem; gap: .5rem;
      color: #334155; text-align: center;
    }
    .empty-icon { font-size: 3rem; opacity: .35; }

    /* ── User card ── */
    .user-card {
      background: #0f1f38; border: 1px solid #1a2d46;
      border-radius: 14px; margin-bottom: 1.25rem; overflow: hidden;
      transition: border-color .2s;
    }
    .user-card:hover { border-color: #2d4f8a; }
    .user-head {
      padding: .85rem 1rem; display: flex; align-items: center;
      gap: .75rem; border-bottom: 1px solid #1a2d46;
    }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #1e3a8a, #4f46e5);
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; font-weight: 800; flex-shrink: 0;
    }
    .user-id   { font-size: .85rem; font-weight: 700; font-family: 'Cascadia Code','Fira Code',monospace; }
    .user-meta { font-size: .68rem; color: #475569; }
    .head-actions { margin-left: auto; display: flex; gap: .4rem; align-items: center; }

    /* ── Instances grid ── */
    .instances-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
      gap: .75rem; padding: .85rem;
    }
    .instance-card {
      background: #0a1428; border: 1px solid #1a2d46;
      border-radius: 10px; padding: .75rem; position: relative;
      transition: border-color .2s;
    }
    .instance-card:hover   { border-color: #2d4a7a; }
    .instance-card.running { border-color: #1a3d5c; }

    /* status dot */
    .dot-wrap { position: absolute; top: .6rem; right: .6rem; }
    .dot { width: 8px; height: 8px; border-radius: 50%; position: relative; display: inline-block; }
    .dot.running  { background: #4ade80; }
    .dot.stopped  { background: #374151; }
    .dot.prov     { background: #60a5fa; }
    .dot.running::before {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      background: #4ade80; animation: ping 1.2s ease-out infinite;
    }

    .ins-platform { font-size: 1.1rem; margin-bottom: .35rem; }
    .ins-id {
      font-size: .67rem; color: #475569; font-family: 'Cascadia Code','Fira Code',monospace;
      margin-bottom: .6rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ins-badge { display: inline-block; padding: .1rem .45rem; border-radius: 5px; font-size: .62rem; font-weight: 700; text-transform: uppercase; }
    .badge-running { background: #052e16; color: #4ade80; }
    .badge-stopped { background: #111827; color: #4b5563; }
    .badge-prov    { background: #0c1d40; color: #60a5fa; }

    .ins-mem-bar  { height: 3px; background: #1a2d46; border-radius: 99px; margin: .5rem 0; overflow: hidden; }
    .ins-mem-fill { height: 100%; background: #2563eb; border-radius: 99px; transition: width .5s ease; }
    .ins-vol  {
      font-size: .67rem; color: #334155; font-family: 'Cascadia Code','Fira Code',monospace;
      background: #060d1a; border-radius: 5px; padding: .15rem .4rem;
      margin-top: .4rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ins-meta { font-size: .67rem; color: #374151; margin-top: .3rem; }
    .ins-actions { display: flex; gap: .3rem; margin-top: .6rem; }
    .btn-icon {
      padding: .3rem .5rem; border-radius: 6px; border: none;
      background: #0f1f38; color: #4b5563; cursor: pointer;
      transition: all .15s; font-size: .75rem; font-family: inherit;
    }
    .btn-icon.sleep:hover { background: #1a2d46; color: #fbbf24; }
    .btn-icon.wake:hover  { background: #1a2d46; color: #34d399; }
    .btn-icon.del:hover   { background: #451a1a; color: #f87171; }
    .btn-icon:disabled    { opacity: .4; cursor: not-allowed; }

    /* ── Docker run command box ── */
    .cmd-header { margin-top: 1.5rem; display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-bottom: .5rem; }
    .cmd-select {
      margin-left: auto; background: #0f1f38; border: 1px solid #1a2d46;
      color: #94a3b8; border-radius: 6px; padding: .25rem .5rem;
      font-size: .75rem; cursor: pointer;
    }
    .cmd-box {
      background: #040a14; border: 1px solid #1a2d46; border-radius: 10px;
      padding: .85rem 1rem; font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
      font-size: .75rem; line-height: 1.8; overflow-x: auto; white-space: pre;
    }
    .c0 { color: #64748b; }  /* comment  */
    .c1 { color: #60a5fa; }  /* flags    */
    .c2 { color: #fbbf24; }  /* volumes  */
    .c3 { color: #34d399; }  /* env vars */
    .c4 { color: #c084fc; }  /* image    */
  `];

  constructor() {
    super();
    this.users   = [];
    this.cmdUser = null;
  }

  /* ── Helpers ── */
  _dispatch(type, detail = {}) { dispatch(this, type, detail); }

  /* ── Render ── */
  render() {
    const activeUser = this.users.find(u => u.id === this.cmdUser) ?? this.users[0];

    return html`
      <div class="anim-slide">
        <div class="section-title"><span>🖥</span> Quản lý Container theo User</div>

        ${this.users.length === 0 ? html`
          <div class="empty-state">
            <div class="empty-icon">📦</div>
            <div style="font-weight:700;color:#334155">Chưa có container nào</div>
            <div style="font-size:.8rem;color:#1e3050">Nhấn "Đăng ký User mới" ở sidebar để bắt đầu</div>
          </div>
        ` : this.users.map(user => this._renderUserCard(user))}

        ${activeUser ? this._renderCmdPanel(activeUser) : nothing}
      </div>
    `;
  }

  _renderUserCard(user) {
    return html`
      <div class="user-card anim-slide">
        <div class="user-head">
          <div class="user-avatar">${user.id.slice(4, 6).toUpperCase()}</div>
          <div>
            <div class="user-id">${user.id}</div>
            <div class="user-meta">Khởi tạo lúc ${user.createdAt} · ${user.instances.length} container(s)</div>
          </div>
          <div class="head-actions">
            <button class="btn-ghost" @click=${() => this._dispatch('add-instance', { userId: user.id })}>
              ＋ Thêm Bot
            </button>
            <button class="btn-danger" title="Xóa user & volume"
              @click=${() => this._dispatch('remove-user', { userId: user.id })}>🗑</button>
          </div>
        </div>
        <div class="instances-grid">
          ${user.instances.map(ins => this._renderInstance(user.id, ins))}
        </div>
      </div>
    `;
  }

  _renderInstance(userId, ins) {
    const running = ins.status === 'running';
    const prov    = ins.status === 'provisioning';
    const memPct  = (ins.memory / 256) * 100;
    const dotCls  = prov ? 'prov anim-pulse' : (running ? 'running' : 'stopped');
    const badgeCls= prov ? 'badge-prov' : (running ? 'badge-running' : 'badge-stopped');
    const label   = prov ? 'Starting...' : (running ? 'running' : 'stopped');

    return html`
      <div class="instance-card ${running ? 'running' : ''} anim-slide">
        <div class="dot-wrap"><span class="dot ${dotCls}"></span></div>
        <div class="ins-platform">${PLATFORM_EMOJI[ins.type] ?? '🤖'}</div>
        <div class="ins-id" title=${ins.id}>${ins.id}</div>
        <span class="ins-badge ${badgeCls}">${label}</span>
        <div class="ins-mem-bar">
          <div class="ins-mem-fill" style="width:${memPct}%"></div>
        </div>
        <div class="ins-meta">${ins.type} · ${ins.memory}MB / 256MB · CPU: ${ins.cpu}%</div>
        <div class="ins-vol">/data/users/${userId}/</div>
        <div class="ins-actions">
          <button
            class="btn-icon ${running ? 'sleep' : 'wake'}"
            title="${running ? 'Sleep (tiết kiệm RAM)' : 'Wake up'}"
            ?disabled=${prov}
            @click=${() => this._dispatch('toggle-instance', { userId, insId: ins.id })}
          >${running ? '😴 Sleep' : '⚡ Wake'}</button>
          <button class="btn-icon del" title="Xóa container"
            @click=${() => this._dispatch('remove-instance', { userId, insId: ins.id })}>🗑</button>
        </div>
      </div>
    `;
  }

  _renderCmdPanel(user) {
    const port = user.instances[0]?.port ?? 8080;
    return html`
      <div class="cmd-header">
        <div class="section-title" style="margin:0;font-size:.9rem">
          <span>💻</span> docker run — <span style="font-family:monospace;color:#60a5fa">${user.id}</span>
        </div>
        ${this.users.length > 1 ? html`
          <select class="cmd-select"
            @change=${(e) => this._dispatch('set-cmd-user', { userId: e.target.value })}>
            ${this.users.map(u => html`
              <option value=${u.id} ?selected=${u.id === user.id}>${u.id}</option>
            `)}
          </select>
        ` : nothing}
      </div>

      <div class="cmd-box"
><span class="c0"># Control Plane gọi lệnh này khi user kích hoạt bot</span>
<span class="c1">docker run</span> <span class="c1">-d</span> \
  <span class="c1">--name</span>     <span class="c0">openclaw-${user.id}</span> \
  <span class="c1">--memory</span>   <span class="c0">"256m"</span>              <span class="c0"># giới hạn RAM (tránh noisy-neighbor)</span>
  <span class="c1">--cpus</span>     <span class="c0">"0.5"</span>              <span class="c0"># giới hạn CPU</span>
  <span class="c2">-v</span>         <span class="c2">/data/users/${user.id}:/app/data</span>  <span class="c0"># Volume mount</span>
  <span class="c1">-p</span>         <span class="c1">127.0.0.1:${port}:3000</span>     <span class="c0"># chỉ expose nội bộ → Nginx proxy</span>
  <span class="c3">-e</span>         <span class="c3">USER_ID=${user.id}</span> \
  <span class="c3">-e</span>         <span class="c3">DATA_DIR=/app/data</span> \
  <span class="c3">-e</span>         <span class="c3">LOG_LEVEL=info</span> \
  <span class="c1">--restart</span>  <span class="c0">unless-stopped</span>      <span class="c0"># auto-restart nếu crash</span>
  <span class="c1">--network</span>  <span class="c0">openclaw-net</span>        <span class="c0"># isolated bridge network</span>
  <span class="c4">openclaw-gateway:v2</span>
</div>
    `;
  }
}

customElements.define('tab-dashboard', TabDashboard);
