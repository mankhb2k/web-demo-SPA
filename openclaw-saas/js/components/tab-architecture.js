/**
 * tab-architecture.js
 * Tab 2: Kiến trúc SaaS — sơ đồ tổng quan + luồng provisioning.
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
          Kiến trúc OpenClaw SaaS
        </div>

        <!-- Architecture diagram -->
        <div class="arch-diagram">
          <div class="arch-row">
            <div class="arch-box arch-blue">
              Browser / SPA
              <div class="arch-label">Next.js · React</div>
            </div>
            <div class="arch-arrow">→</div>
            <div class="arch-box arch-amber">
              API Gateway
              <div class="arch-label">Nginx / Cloudflare</div>
            </div>
            <div class="arch-arrow">→</div>
            <div class="arch-box arch-purple">
              Control Plane
              <div class="arch-label">Fastify · BullMQ</div>
            </div>
          </div>

          <div class="arch-down">↓</div>
          <div style="font-size:.72rem;color:#334155;margin-bottom:.3rem;text-align:center">
            Docker Engine (VPS / K3s)
          </div>

          <div class="gateway-pool">
            ${gwUsers.map(id => html`
              <div class="gw-instance">
                <div class="gw-dot"></div>openclaw-${id}
              </div>
            `)}
            <div class="gw-instance ghost">+ more...</div>
          </div>

          <div class="arch-down">↕</div>

          <div class="arch-row">
            ${['Telegram','WhatsApp','Zalo','Discord'].map(ch => html`
              <div class="arch-box arch-cyan" style="min-width:100px">${ch}</div>
            `)}
          </div>
        </div>

        <!-- Provisioning steps -->
        <div class="section-title" style="font-size:.9rem">
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
