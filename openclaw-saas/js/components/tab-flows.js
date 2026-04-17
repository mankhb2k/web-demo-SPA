/**
 * tab-flows.js
 * Tab: Luồng hệ thống — Create Project, User Request, Idle Shutdown, Auto Wake.
 *
 * No external props needed — purely static/animated illustration.
 */
import { LitElement, html } from 'https://esm.sh/lit@3';

const FLOWS = [
  {
    id: 'create',
    icon: 'folder-plus',
    color: '#3b82f6',
    title: 'Flow tạo Project',
    steps: [
      { icon: 'mouse-pointer-click', label: 'User click "Create Project"', plane: 'frontend' },
      { icon: 'send',               label: 'Frontend gọi API → Control Plane', plane: 'control' },
      { icon: 'database',           label: 'Backend tạo record project (status: creating)', plane: 'control' },
      { icon: 'layers',             label: 'Push job vào Redis Queue (BullMQ)', plane: 'control' },
      { icon: 'cpu',                label: 'Worker nhận job: docker run openclaw', plane: 'data' },
      { icon: 'network',            label: 'Cấp port ngẫu nhiên cho container', plane: 'data' },
      { icon: 'database',           label: 'Update DB → status: running', plane: 'control' },
      { icon: 'globe',              label: 'Trả domain cho user (project.domain.com)', plane: 'frontend' },
    ],
  },
  {
    id: 'request',
    icon: 'arrow-right-from-line',
    color: '#22c55e',
    title: 'Flow request User',
    steps: [
      { icon: 'user',              label: 'User gửi request → project.domain.com', plane: 'frontend' },
      { icon: 'route',             label: 'Reverse Proxy (Nginx / Traefik) định tuyến', plane: 'data' },
      { icon: 'box',               label: 'Container tương ứng nhận request', plane: 'data' },
      { icon: 'zap',               label: 'OpenClaw xử lý → trả response', plane: 'data' },
    ],
  },
  {
    id: 'idle',
    icon: 'moon',
    color: '#f59e0b',
    title: 'Flow Idle Shutdown',
    steps: [
      { icon: 'timer-off',         label: 'Không có request trong 10 phút', plane: 'data' },
      { icon: 'search',            label: 'Hệ thống detect idle → Control Plane', plane: 'control' },
      { icon: 'square',            label: 'docker stop container → giải phóng RAM', plane: 'data' },
      { icon: 'hard-drive',        label: 'Volume vẫn giữ nguyên (SQLite an toàn)', plane: 'data' },
      { icon: 'database',          label: 'Update DB → status: stopped', plane: 'control' },
    ],
  },
  {
    id: 'wake',
    icon: 'sunrise',
    color: '#a78bfa',
    title: 'Flow Auto Wake',
    steps: [
      { icon: 'send',              label: 'User gửi request → container đang stopped', plane: 'frontend' },
      { icon: 'webhook',           label: 'Proxy trigger Control Plane → wake job', plane: 'control' },
      { icon: 'play',              label: 'docker start container → load state từ Volume', plane: 'data' },
      { icon: 'clock',             label: 'Cold start 3–5 giây...', plane: 'data' },
      { icon: 'zap',               label: 'Container ready → xử lý request', plane: 'data' },
    ],
  },
];

const PLANE_STYLE = {
  frontend: { bg: '#0c1d40', border: '#1d4ed8', color: '#7dd3fc', label: 'Frontend' },
  control:  { bg: '#1e1040', border: '#7c3aed', color: '#c4b5fd', label: 'Control Plane' },
  data:     { bg: '#052e16', border: '#16a34a', color: '#4ade80', label: 'Data Plane' },
};

class TabFlows extends LitElement {
  static properties = {
    _active: { state: true },
  };

  createRenderRoot() { return this; }

  constructor() {
    super();
    this._active = 'create';
  }

  render() {
    const flow = FLOWS.find(f => f.id === this._active);

    return html`
      <style>
        /* Inlined CSS for reliability on local servers */
        .flow-tabs { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .flow-tab-btn {
          padding: .45rem .9rem; border-radius: 8px; border: 1px solid #1a2d46;
          background: transparent; color: #94a3b8; font-size: .78rem; font-weight: 600;
          cursor: pointer; transition: all .18s; font-family: inherit;
          display: inline-flex; align-items: center; gap: .35rem;
        }
        .flow-tab-btn:hover { background: #0f1f38; color: #fff; }
        .flow-tab-btn.active { background: #0f1f38; border-color: currentColor; }
        
        .plane-legend { display: flex; gap: 1.25rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .legend-item { font-size: .72rem; color: #64748b; display: flex; align-items: center; gap: .35rem; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        .flow-diagram { display: flex; flex-direction: column; gap: 0; }
        .flow-step-row { display: flex; flex-direction: column; align-items: flex-start; }
        .step-index { font-size: .65rem; font-weight: 800; font-family: monospace; margin-bottom: .35rem; padding-left: .25rem; }
        .flow-step-card {
          border: 1px solid; border-radius: 10px; padding: .65rem 1rem; width: 100%;
          display: flex; align-items: center; gap: .75rem; transition: filter .15s;
        }
        .flow-step-text { flex: 1; font-size: .83rem; font-weight: 500; color: #e2e8f0; }
        .flow-plane-tag { border: 1px solid; border-radius: 5px; padding: .1rem .45rem; font-size: .6rem; font-weight: 700; text-transform: uppercase; }
        .flow-connector { width: 2px; height: 18px; border-left: 2px dashed #1e3a5f; margin-left: 1.5rem; }

        .mechanisms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: .75rem; margin-top: .75rem; }
        .mech-card { background: #0f1f38; border: 1px solid #1a2d46; border-radius: 10px; padding: .85rem 1rem; display: flex; gap: .75rem; }
        .mech-title { font-size: .85rem; font-weight: 700; color: #f1f5f9; margin-bottom: .2rem; }
        .mech-body { font-size: .75rem; color: #94a3b8; font-family: monospace; }
        .mech-note { font-size: .68rem; color: #475569; margin-top: .25rem; }

        .cost-summary { margin-top: 1.5rem; background: #0f1f38; border: 1px solid #1a2d46; border-radius: 12px; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .6rem; }
        .cost-item { display: flex; align-items: center; gap: .6rem; font-size: .83rem; color: #94a3b8; }
        .cost-item strong { margin-left: auto; }
        .cost-item.cost-total { border-top: 1px solid #1a2d46; padding-top: .6rem; color: #e2e8f0; font-weight: 600; }
        .cost-divider { text-align: center; font-size: 1rem; color: #1e3a5f; font-weight: 800; padding-left: 1.7rem; }
      </style>

      <div>
        <div class="section-title">
          <iconify-icon icon="lucide:git-branch" style="margin-right:.5rem;color:#a78bfa"></iconify-icon>
          Luồng Hoạt Động Hệ Thống
        </div>

        <!-- Flow selector tabs -->
        <div class="flow-tabs">
          ${FLOWS.map(f => html`
            <button
              class="flow-tab-btn ${this._active === f.id ? 'active' : ''}"
              style="${this._active === f.id ? `border-color:${f.color};color:${f.color}` : ''}"
              @click=${() => { this._active = f.id; }}
            >
              <iconify-icon icon="lucide:${f.icon}"></iconify-icon>
              ${f.title}
            </button>
          `)}
        </div>

        <!-- Legend -->
        <div class="plane-legend">
          ${Object.entries(PLANE_STYLE).map(([k, v]) => html`
            <div class="legend-item">
              <span class="legend-dot" style="background:${v.border}"></span>
              ${v.label}
            </div>
          `)}
        </div>

        <!-- Flow diagram -->
        <div class="flow-diagram">
          ${flow.steps.map((step, i) => {
            const ps = PLANE_STYLE[step.plane];
            return html`
              <div class="flow-step-row anim-slide" style="animation-delay:${i * 50}ms">
                <div class="step-index" style="color:${flow.color}">${String(i + 1).padStart(2, '0')}</div>
                <div class="flow-step-card"
                  style="background:${ps.bg};border-color:${ps.border}">
                  <iconify-icon icon="lucide:${step.icon}" style="color:${ps.color};font-size:1.1rem;flex-shrink:0"></iconify-icon>
                  <div class="flow-step-text">${step.label}</div>
                  <span class="flow-plane-tag" style="background:${ps.bg};border-color:${ps.border};color:${ps.color}">
                    ${ps.label}
                  </span>
                </div>
                ${i < flow.steps.length - 1 ? html`
                  <div class="flow-connector" style="border-color:${flow.color}40"></div>
                ` : ''}
              </div>
            `;
          })}
        </div>

        <!-- Mechanisms panel -->
        <div class="section-title" style="font-size:.9rem;margin-top:1.75rem">
          <iconify-icon icon="lucide:shield-alert" style="margin-right:.5rem;color:#ef4444"></iconify-icon>
          Cơ chế bắt buộc — Không có = Lag / Crash / Đốt tiền
        </div>
        <div class="mechanisms-grid">
          ${[
            { icon: 'cpu',       color: '#3b82f6', title: 'Resource Limit',    body: '--cpus=0.5 · --memory=512m',    note: 'Tránh noisy-neighbor, 1 ctr không đốt cả VPS' },
            { icon: 'moon',      color: '#f59e0b', title: 'Idle Shutdown',     body: '5–15 phút không dùng → stop',   note: 'Giải phóng RAM, cho container khác dùng' },
            { icon: 'layers',    color: '#a78bfa', title: 'Queue System',      body: 'Redis + BullMQ async worker',   note: 'Không block API, xử lý tuần tự, retry on fail' },
            { icon: 'scroll',    color: '#34d399', title: 'Logging',           body: 'Container log + usage tracking', note: 'Debug, billing, audit trail' },
          ].map(m => html`
            <div class="mech-card">
              <div class="mech-icon" style="color:${m.color}">
                <iconify-icon icon="lucide:${m.icon}"></iconify-icon>
              </div>
              <div>
                <div class="mech-title">${m.title}</div>
                <div class="mech-body">${m.body}</div>
                <div class="mech-note">${m.note}</div>
              </div>
            </div>
          `)}
        </div>

        <!-- Cost summary -->
        <div class="cost-summary">
          <div class="cost-item">
            <iconify-icon icon="lucide:train-front" style="color:#818cf8"></iconify-icon>
            <span>Railway (Control Plane)</span>
            <strong style="color:#fbbf24">$5–20 / tháng</strong>
          </div>
          <div class="cost-divider">+</div>
          <div class="cost-item">
            <iconify-icon icon="lucide:server" style="color:#4ade80"></iconify-icon>
            <span>Contabo VPS 12vCPU 48GB (Data Plane)</span>
            <strong style="color:#fbbf24">~$20–25 / tháng</strong>
          </div>
          <div class="cost-divider">=</div>
          <div class="cost-item cost-total">
            <iconify-icon icon="lucide:wallet" style="color:#f87171"></iconify-icon>
            <span>Tổng chi phí</span>
            <strong style="color:#4ade80;font-size:1.1rem">~$30–50 / tháng</strong>
          </div>
        </div>

      </div>
    `;
  }
}

customElements.define('tab-flows', TabFlows);
