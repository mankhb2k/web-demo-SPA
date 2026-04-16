/**
 * tab-dashboard.js
 * Tab 1: Bảng điều khiển — quản lý users & containers tương tác.
 *
 * Nhận props:  users (Array), cmdUser (String)
 * Phát events: add-instance, toggle-instance, remove-instance,
 *              remove-user, set-cmd-user  (all bubble + composed)
 */
import { LitElement, html, nothing } from 'https://esm.sh/lit@3';
import { PLATFORM_EMOJI, dispatch } from '../helpers.js';

class TabDashboard extends LitElement {
  static properties = {
    users:   { type: Array },
    cmdUser: { type: String },
  };

  createRenderRoot() { return this; }


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
        <div class="section-title">
          <iconify-icon icon="lucide:monitor" style="margin-right: .5rem; color: #60a5fa;"></iconify-icon>
          Quản lý Container theo User
        </div>

        ${this.users.length === 0 ? html`
          <div class="empty-state">
            <iconify-icon icon="lucide:box-select" class="empty-icon"></iconify-icon>
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
            <div class="user-id" style="display:flex;align-items:center;gap:.4rem; color: #fafafa">
              ${user.id}
              <span style="font-size:.6rem; background:#27272a; color:#fafafa; border:1px solid #3f3f46; padding:.1rem .3rem; border-radius:4px; font-weight:600; text-transform:uppercase;">${user.tier || 'Free'}</span>
            </div>
            <div class="user-meta">Khởi tạo lúc ${user.createdAt} · ${user.instances.length} container(s)</div>
          </div>
          <div class="head-actions">
            ${(user.tier === 'Free' || !user.tier) && user.instances.length >= 2 ? html`
              <button class="btn-ghost" disabled title="Free tier giới hạn giới hạn tối đa 2 containers!" style="opacity:0.5;cursor:not-allowed">
                <iconify-icon icon="lucide:lock" style="margin-right: .3rem;"></iconify-icon>
                Limit 2/2
              </button>
            ` : html`
              <button class="btn-ghost" @click=${() => this._dispatch('add-instance', { userId: user.id })}>
                <iconify-icon icon="lucide:plus-circle" style="margin-right: .3rem;"></iconify-icon>
                Thêm Bot
              </button>
            `}
            <button class="btn-danger" title="Xóa user & volume"
              @click=${() => this._dispatch('remove-user', { userId: user.id })}>
              <iconify-icon icon="lucide:trash-2"></iconify-icon>
            </button>
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
            >
              <iconify-icon icon="lucide:${running ? 'moon' : 'zap'}" style="margin-right: .3rem;"></iconify-icon>
              ${running ? 'Sleep' : 'Wake'}
            </button>
            <button class="btn-icon del" title="Xóa container"
              @click=${() => this._dispatch('remove-instance', { userId, insId: ins.id })}>
              <iconify-icon icon="lucide:trash-2"></iconify-icon>
            </button>
        </div>
      </div>
    `;
  }

  _renderCmdPanel(user) {
    const port = user.instances[0]?.port ?? 8080;
    return html`
      <div class="cmd-header">
        <div class="section-title" style="margin:0;font-size:.9rem">
          <iconify-icon icon="lucide:terminal" style="margin-right: .5rem; color: #a78bfa;"></iconify-icon>
          docker run — <span style="font-family:monospace;color:#60a5fa">${user.id}</span>
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
