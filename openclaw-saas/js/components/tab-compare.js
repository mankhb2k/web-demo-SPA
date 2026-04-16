/**
 * tab-compare.js
 * Tab 4: So sánh — 3 mô hình triển khai + bảng + chi phí.
 * Static content — không cần props.
 */
import { LitElement, html } from 'https://esm.sh/lit@3';

class TabCompare extends LitElement {
  createRenderRoot() { return this; }


  static _TABLE_ROWS = [
    ['Bảo mật (Data Leak)',   'bad:Rủi ro cao',      'good:Rất cao',      'good:Tốt'],
    ['Cô lập RAM/CPU',        'bad:Không',            'good:Dễ (Docker)',  'good:Theo tier'],
    ['Chi phí RAM nền',       'good:Thấp nhất',       'mid:20–40MB/ctr',   'mid:Tùy tier'],
    ['Scaling',               'bad:Thủ công',         'good:Auto (K8s)',   'good:Auto'],
    ['Độ phức tạp ops',       'good:Thấp',            'mid:Trung bình',    'mid:Cao hơn'],
    ['Break-even users',      'good:1 user',          'mid:~6 Pro users',  'mid:Theo tier'],
    ['GDPR compliance',       'bad:Khó',              'good:Dễ',           'good:Tốt'],
    ['Update per-user',       'bad:Không (toàn hệ)',  'good:Linh hoạt',   'good:Theo tier'],
  ];

  render() {
    return html`
      <div class="anim-slide">
        <div class="section-title">
          <iconify-icon icon="lucide:arrow-left-right" style="margin-right: .5rem; color: #fbbf24;"></iconify-icon>
          So sánh Mô hình Triển khai
        </div>

        <!-- 3 model cards -->
        <div class="compare-grid">
          <div class="compare-card">
            <span class="compare-badge badge-mvp">MVP Phase</span>
            <div class="compare-title">A · Shared VPS</div>
            <div class="compare-cost">~$40–80 / tháng → 20–40 users</div>
            <div class="pro-con">
              <div class="pro">Chi phí thấp nhất, triển khai nhanh</div>
              <div class="pro">Đơn giản — 1 VPS + PM2/systemd</div>
              <div class="con">Noisy-neighbor: user A ảnh hưởng user B</div>
              <div class="con">Bảo mật thấp (cùng process space)</div>
              <div class="con">Scale thủ công, khó kiểm soát</div>
              <div class="neu">Phù hợp: 0–100 user đầu tiên (MVP)</div>
            </div>
          </div>

          <div class="compare-card highlight">
            <span class="compare-badge badge-rec">★ Khuyến nghị</span>
            <div class="compare-title">B · Per-user Container</div>
            <div class="compare-cost">~$0.5–2 / user / tháng</div>
            <div class="pro-con">
              <div class="pro">Hoàn toàn cô lập (kernel namespace)</div>
              <div class="pro">Resource limit dễ (--memory --cpus)</div>
              <div class="pro">Scale tự động, dễ migration</div>
              <div class="pro">GDPR-compliant, dễ audit</div>
              <div class="con">Chi phí RAM nền ~20–40MB/container</div>
              <div class="con">Cần biết Docker / Kubernetes</div>
              <div class="neu">Phù hợp: từ 100+ users trở lên</div>
            </div>
          </div>

          <div class="compare-card">
            <span class="compare-badge badge-best">Best Practice</span>
            <div class="compare-title">C · Hybrid Tiers</div>
            <div class="compare-cost">Tối ưu chi phí theo gói</div>
            <div class="pro-con">
              <div class="pro">Free tier → Shared VPS (sleep 10 phút)</div>
              <div class="pro">Pro tier → Dedicated Container (always-on)</div>
              <div class="pro">Team tier → Dedicated VPS + custom domain</div>
              <div class="neu">Cách Render, Railway, Fly.io đang làm</div>
              <div class="neu">Upsell tự nhiên theo nhu cầu user</div>
            </div>
          </div>
        </div>

        <!-- Comparison table -->
        <div class="panel" style="margin-bottom:1rem">
          <div class="panel-title">
            <iconify-icon icon="lucide:bar-chart-3" style="margin-right: .4rem;"></iconify-icon>
            Bảng so sánh chi tiết
          </div>
          <div style="overflow-x:auto">
            <table class="cmp-table">
              <thead>
                <tr>
                  <th>Tiêu chí</th>
                  <th>Shared VPS</th>
                  <th>Per-user Container</th>
                  <th>Hybrid</th>
                </tr>
              </thead>
              <tbody>
                ${TabCompare._TABLE_ROWS.map(([label, ...cols]) => html`
                  <tr>
                    <td>${label}</td>
                    ${cols.map(c => {
                      const [cls, text] = c.split(':');
                      return html`<td class="${cls}">${text}</td>`;
                    })}
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cost panels -->
        <div class="cost-grid">
          <div class="panel">
            <div class="panel-title">
              <iconify-icon icon="lucide:banknote" style="margin-right: .4rem; color: #fbbf24;"></iconify-icon>
              Chi phí Free Tier (ước tính)
            </div>
            <div class="cost-row">
              <div>Container ngủ sau 10 phút idle → ~0 CPU</div>
              <div>Storage 500 MB → ~$0.01/tháng</div>
              <div>Bandwidth tối thiểu → ~$0.05/tháng</div>
              <div class="cost-total yellow">Tổng: ~$0.20 / user / tháng</div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-title">
              <iconify-icon icon="lucide:gem" style="margin-right: .4rem; color: #60a5fa;"></iconify-icon>
              Chi phí Pro Tier ($9/tháng)
            </div>
            <div class="cost-row">
              <div>Container always-on 256 MB → ~$1.5/tháng</div>
              <div>Storage 5 GB → ~$0.12/tháng</div>
              <div>Bandwidth + overhead → ~$0.5/tháng</div>
              <div class="cost-total green">Margin: ~$6.88 / user / tháng (76%)</div>
            </div>
          </div>
        </div>

        <div class="info-card info-blue" style="margin-top:.75rem">
          <div class="info-icon"><iconify-icon icon="lucide:trending-up"></iconify-icon></div>
          <div class="info-body">
            <strong>Break-even:</strong> 1 VPS Custom ($52/tháng, 6 vCPU / 18 GB / 1 TB SSD) hỗ trợ ~80 always-on Pro users.
            Chỉ cần <strong>6 Pro users</strong> để hòa vốn 1 VPS.
            Tại <strong>100 Pro users</strong> = $900 MRR với chi phí server ~$100 (cluster) → margin ~<strong>89%</strong>.
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('tab-compare', TabCompare);
