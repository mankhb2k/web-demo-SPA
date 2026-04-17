/**
 * tab-architecture.js
 * Tab 2: Kiến trúc OpenClaw SaaS — Control Plane + Data Plane.
 *
 * Nhận props: users (Array) — để hiện gateway pool động
 * Local state: _activeStep (number|null) — expand/collapse step
 */
import { LitElement, html, nothing } from 'https://esm.sh/lit@3';
import { PROVISION_STEPS } from '../helpers.js';

class TabArchitecture extends LitElement {
  static properties = {
    users:       { type: Array },
    _activeStep: { state: true },
  };

  createRenderRoot() { return this; }

  constructor() {
    super();
    this.users       = [];
    this._activeStep = null;
  }

  render() {
    const gwUsers = this.users.length > 0
      ? this.users.map(u => u.id)
      : ['usr_abc1', 'usr_def2', 'usr_ghi3'];

    return html`
      <div class="anim-slide">
        <div class="section-title">
          <iconify-icon icon="lucide:network" style="margin-right: .5rem; color: #7c3aed;"></iconify-icon>
          Kiến trúc OpenClaw SaaS — 2 Lớp
        </div>

        <!-- ── Two-layer architecture ── -->
        <div class="two-layer-arch">

          <!-- Control Plane -->
          <div class="layer-box layer-control">
            <div class="layer-header">
              <iconify-icon icon="lucide:brain" style="color:#a78bfa"></iconify-icon>
              <span>Control Plane</span>
              <span class="layer-badge badge-railway">Railway $5–20</span>
            </div>
            <div class="layer-services">
              <div class="svc-pill svc-blue">
                <iconify-icon icon="lucide:shield"></iconify-icon>
                NestJS + Fastify
                <span class="svc-tag">API</span>
              </div>
              <div class="svc-pill svc-purple">
                <iconify-icon icon="lucide:database"></iconify-icon>
                PostgreSQL
                <span class="svc-tag">DB</span>
              </div>
              <div class="svc-pill svc-red">
                <iconify-icon icon="lucide:layers"></iconify-icon>
                Redis + BullMQ
                <span class="svc-tag">Queue</span>
              </div>
              <div class="svc-pill svc-amber">
                <iconify-icon icon="lucide:activity"></iconify-icon>
                Worker
                <span class="svc-tag">Async</span>
              </div>
            </div>
            <div class="layer-duties">
              <div class="duty">
                <iconify-icon icon="lucide:users" style="color:#60a5fa"></iconify-icon>
                Quản lý User & Auth
              </div>
              <div class="duty">
                <iconify-icon icon="lucide:folder-plus" style="color:#a78bfa"></iconify-icon>
                Tạo & điều phối Project
              </div>
              <div class="duty">
                <iconify-icon icon="lucide:bar-chart-2" style="color:#34d399"></iconify-icon>
                Tracking Usage & Billing
              </div>
              <div class="duty">
                <iconify-icon icon="lucide:cpu" style="color:#fbbf24"></iconify-icon>
                Quản lý Queue Job
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="layer-arrow">
            <div class="arrow-line"></div>
            <div class="arrow-label">Docker API<br>SSH / REST</div>
            <div class="arrow-line"></div>
          </div>

          <!-- Data Plane -->
          <div class="layer-box layer-data">
            <div class="layer-header">
              <iconify-icon icon="lucide:server" style="color:#4ade80"></iconify-icon>
              <span>Data Plane</span>
              <span class="layer-badge badge-contabo">Contabo VPS ~$20</span>
            </div>
            <div class="layer-services">
              <div class="svc-pill svc-green">
                <iconify-icon icon="lucide:container"></iconify-icon>
                Docker Runtime
                <span class="svc-tag">Engine</span>
              </div>
              <div class="svc-pill svc-cyan">
                <iconify-icon icon="lucide:layout-grid"></iconify-icon>
                Portainer
                <span class="svc-tag">Manage</span>
              </div>
              <div class="svc-pill svc-teal">
                <iconify-icon icon="lucide:git-branch"></iconify-icon>
                Traefik / Nginx
                <span class="svc-tag">Proxy</span>
              </div>
            </div>
            <div class="layer-duties">
              <div class="duty">
                <iconify-icon icon="lucide:box" style="color:#4ade80"></iconify-icon>
                Chạy container OpenClaw
              </div>
              <div class="duty">
                <iconify-icon icon="lucide:zap" style="color:#fbbf24"></iconify-icon>
                Xử lý request của user
              </div>
              <div class="duty">
                <iconify-icon icon="lucide:hard-drive" style="color:#60a5fa"></iconify-icon>
                Volume mount /data/users/
              </div>
            </div>
            <!-- Gateway pool live -->
            <div class="gw-pool-mini">
              ${gwUsers.map(id => html`
                <div class="gw-mini-chip">
                  <span class="gw-mini-dot"></span>
                  ${id.slice(0, 10)}
                </div>
              `)}
              <div class="gw-mini-chip ghost">+ more…</div>
            </div>
          </div>
        </div>

        <!-- ── Capacity info ── -->
        <div class="capacity-row">
          <div class="cap-card">
            <div class="cap-val" style="color:#3b82f6">70–80</div>
            <div class="cap-name">Container nhẹ</div>
          </div>
          <div class="cap-card">
            <div class="cap-val" style="color:#a78bfa">40–60</div>
            <div class="cap-name">Container trung bình</div>
          </div>
          <div class="cap-card">
            <div class="cap-val" style="color:#f87171">20–30</div>
            <div class="cap-name">Container nặng</div>
          </div>
          <div class="cap-card">
            <div class="cap-val" style="color:#34d399">200–500</div>
            <div class="cap-name">User idle</div>
          </div>
          <div class="cap-card">
            <div class="cap-val" style="color:#fbbf24">30–50</div>
            <div class="cap-name">User active</div>
          </div>
        </div>

        <!-- ── VPS specs ── -->
        <div class="vps-spec-row">
          <div class="vps-spec">
            <iconify-icon icon="lucide:cpu" style="color:#60a5fa"></iconify-icon>
            <strong>12 vCPU</strong>
          </div>
          <div class="vps-spec">
            <iconify-icon icon="lucide:memory-stick" style="color:#a78bfa"></iconify-icon>
            <strong>48 GB RAM</strong>
          </div>
          <div class="vps-spec">
            <iconify-icon icon="lucide:hard-drive" style="color:#34d399"></iconify-icon>
            <strong>--cpus=0.5 / ctr</strong>
          </div>
          <div class="vps-spec">
            <iconify-icon icon="lucide:shield" style="color:#fbbf24"></iconify-icon>
            <strong>--memory=512m / ctr</strong>
          </div>
        </div>

        <!-- ── Provisioning steps ── -->
        <div class="section-title" style="font-size:.9rem;margin-top:1.5rem">
          <iconify-icon icon="lucide:refresh-cw" style="margin-right: .5rem; color: #0891b2;"></iconify-icon>
          Luồng Provisioning — User → Bot Active
          <span style="font-size:.7rem;color:#475569;font-weight:400;margin-left:.5rem">
            (nhấn để mở rộng)
          </span>
        </div>

        <div class="flow-steps">
          ${PROVISION_STEPS.map(s => html`
            <div
              class="flow-step ${this._activeStep === s.n ? 'active' : ''}"
              @click=${() => { this._activeStep = this._activeStep === s.n ? null : s.n; }}
            >
              <div class="step-num">${s.n}</div>
              <div class="step-content">
                <div class="step-title">${s.title}</div>
                ${this._activeStep === s.n ? html`
                  <div class="step-detail">${s.detail}</div>
                  <code class="step-code">${s.code}</code>
                ` : nothing}
              </div>
              <span class="step-chevron">
                <iconify-icon icon="lucide:chevron-${this._activeStep === s.n ? 'up' : 'down'}"></iconify-icon>
              </span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('tab-architecture', TabArchitecture);
