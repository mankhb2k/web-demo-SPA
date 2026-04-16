/**
 * tab-architecture.js
 * Tab 2: Kiến trúc SaaS — sơ đồ tổng quan + luồng provisioning.
 *
 * Nhận props: users (Array) — để hiện gateway pool động
 * Local state: _activeStep (number|null) — expand/collapse step
 */
import { LitElement, html, css, nothing } from 'https://esm.sh/lit@3';
import { sharedStyles } from '../styles/shared.js';
import { PROVISION_STEPS } from '../helpers.js';

class TabArchitecture extends LitElement {
  static properties = {
    users:       { type: Array },
    _activeStep: { state: true },
  };

  static styles = [sharedStyles, css`
    :host { display: block; }

    /* ── Architecture diagram ── */
    .arch-diagram {
      display: flex; flex-direction: column; gap: .6rem;
      align-items: center; margin-bottom: 1.75rem;
    }
    .arch-row {
      display: flex; gap: .75rem; align-items: center;
      flex-wrap: wrap; justify-content: center;
    }
    .arch-box {
      border-radius: 12px; padding: .75rem 1.1rem; text-align: center;
      border: 1px solid; font-size: .8rem; font-weight: 700; min-width: 130px;
    }
    .arch-arrow { color: #1e3a5f; font-size: 1.4rem; }
    .arch-label { font-size: .65rem; font-weight: 400; opacity: .7; margin-top: .2rem; }
    .arch-blue   { background: #0c1d40; border-color: #1d4ed8; color: #7dd3fc; }
    .arch-amber  { background: #1c1200; border-color: #d97706; color: #fcd34d; }
    .arch-purple { background: #1e1040; border-color: #7c3aed; color: #c4b5fd; }
    .arch-cyan   { background: #042026; border-color: #0891b2; color: #67e8f9; }
    .arch-down   { color: #1e3a5f; font-size: 1.4rem; }

    /* ── Gateway pool ── */
    .gateway-pool {
      background: #0c1a2e; border: 1px solid #1a2d46; border-radius: 14px;
      padding: .85rem; display: flex; flex-wrap: wrap; gap: .5rem;
      justify-content: center; max-width: 600px;
    }
    .gw-instance {
      background: #0f1f38; border: 1px solid #1a3a5c; border-radius: 8px;
      padding: .4rem .7rem; font-size: .7rem; color: #60a5fa;
      font-family: 'Cascadia Code','Fira Code',monospace;
      display: flex; align-items: center; gap: .35rem;
    }
    .gw-instance.ghost { color: #1e3050; border-color: #0f1f38; }
    .gw-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }

    /* ── Provisioning flow steps ── */
    .flow-steps { display: flex; flex-direction: column; gap: .5rem; margin-top: 1.25rem; }
    .flow-step {
      display: flex; gap: .85rem; align-items: flex-start;
      background: #0f1f38; border: 1px solid #1a2d46; border-radius: 10px;
      padding: .7rem .85rem; cursor: pointer; transition: border-color .2s;
    }
    .flow-step:hover  { border-color: #2d4f8a; }
    .flow-step.active { border-color: #1d4ed8; }
    .step-num {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      background: #1a2d46; display: flex; align-items: center; justify-content: center;
      font-size: .7rem; font-weight: 800; color: #60a5fa;
    }
    .step-content { flex: 1; font-size: .82rem; }
    .step-title   { font-weight: 700; color: #e2e8f0; margin-bottom: .2rem; }
    .step-detail  { font-size: .73rem; color: #475569; line-height: 1.5; margin-top: .25rem; }
    .step-code {
      font-family: 'Cascadia Code','Fira Code',monospace;
      background: #060d1a; border-radius: 5px;
      padding: .25rem .5rem; margin-top: .35rem;
      font-size: .7rem; color: #60a5fa; display: block;
    }
    .step-chevron { color: #1e3a5f; font-size: .8rem; flex-shrink: 0; }
  `];

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
        <div class="section-title"><span>🏗</span> Kiến trúc OpenClaw SaaS</div>

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
          <span>🔄</span> Luồng Provisioning — User → Bot Active
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
              <span class="step-chevron">${this._activeStep === s.n ? '▲' : '▼'}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('tab-architecture', TabArchitecture);
