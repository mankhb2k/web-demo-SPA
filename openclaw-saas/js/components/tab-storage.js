/**
 * tab-storage.js
 * Tab 3: Lưu trữ — Volume, file tree, lifecycle dữ liệu.
 *
 * Nhận props: users (Array)
 */
import { LitElement, html, css } from 'https://esm.sh/lit@3';
import { sharedStyles } from '../styles/shared.js';

class TabStorage extends LitElement {
  static properties = {
    users: { type: Array },
  };

  static styles = [sharedStyles, css`
    :host { display: block; }

    .two-col {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;
    }
    @media (max-width: 640px) { .two-col { grid-template-columns: 1fr; } }

    /* ── Lifecycle cards ── */
    .lifecycle-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(155px,1fr)); gap: .75rem;
    }
    .lifecycle-card {
      background: #0f1f38; border: 1px solid #1a2d46;
      border-radius: 12px; padding: .85rem; text-align: center;
    }
    .lc-icon  { font-size: 1.5rem; margin-bottom: .4rem; }
    .lc-label { font-size: .78rem; font-weight: 700; color: #e2e8f0; margin-bottom: .3rem; }
    .lc-desc  { font-size: .7rem; color: #64748b; line-height: 1.5; }

    /* ── Encryption snippet ── */
    .enc-box {
      background: #040a14; border: 1px solid #1a2d46; border-radius: 10px;
      padding: .75rem 1rem; font-family: 'Cascadia Code','Fira Code','Consolas',monospace;
      font-size: .72rem; line-height: 1.9;
    }
    .enc-c0 { color: #64748b; }
    .enc-c1 { color: #60a5fa; }
    .enc-c2 { color: #fbbf24; }
    .enc-c3 { color: #4ade80; }
  `];

  constructor() {
    super();
    this.users = [];
  }

  render() {
    return html`
      <div class="anim-slide">
        <div class="section-title"><span>💾</span> Hệ thống Volume — Lưu trữ ngoài Container</div>

        <div class="two-col">
          <!-- File tree -->
          <div class="panel">
            <div class="panel-title"><span>📁</span> Cấu trúc thư mục (Host)</div>
            <div class="tree">
              <div class="tree-root">
                /data/users/ <span class="tree-tag">(Persistent Storage Root)</span>
              </div>
              ${this.users.length > 0 ? this.users.map(u => html`
                <div class="tree-indent">
                  <div class="tree-dir">📁 ${u.id}/</div>
                  <div class="tree-indent">
                    <div class="tree-file">├─ 📄 openclaw.db <span class="tree-tag">(SQLite · messages · tasks)</span></div>
                    <div class="tree-file">├─ 📄 config.json <span class="tree-tag">(tokens · AES-256 encrypted)</span></div>
                    <div class="tree-file">├─ 📁 logs/</div>
                    <div class="tree-indent">
                      <div class="tree-file">│  ├─ gateway.log <span class="tree-tag">(7d TTL)</span></div>
                      <div class="tree-file">│  └─ audit.log   <span class="tree-tag">(90d TTL)</span></div>
                    </div>
                    <div class="tree-file">├─ 📁 attachments/ <span class="tree-tag">(files user gửi)</span></div>
                    <div class="tree-file">└─ 📁 backups/</div>
                    <div class="tree-indent">
                      <div class="tree-file">└─ 2026-04-16.tar.gz</div>
                    </div>
                  </div>
                </div>
              `) : html`
                <div class="tree-indent" style="color:#1e3050;font-style:italic">
                  Thêm User ở sidebar để xem cấu trúc thư mục...
                </div>
              `}
            </div>
          </div>

          <!-- Info cards -->
          <div style="display:flex;flex-direction:column;gap:.75rem">
            <div class="info-card info-blue">
              <div class="info-icon">💡</div>
              <div class="info-body">
                <strong>Tại sao cần Volume?</strong><br>
                Dữ liệu bên trong Container là <strong>ephemeral</strong> — khi container bị xóa hay
                cập nhật, data mất hoàn toàn. Volume "mount" thư mục từ ổ cứng Host vào container.
                Bot có thể stop/start bao nhiêu lần mà không mất chat history hay config.
              </div>
            </div>
            <div class="info-card info-amber">
              <div class="info-icon">🔒</div>
              <div class="info-body">
                <strong>1 User = 1 Namespace riêng</strong><br>
                Khi User A xóa tài khoản chỉ cần
                <code style="font-family:monospace;font-size:.85em">rm -rf /data/users/usr_abc/</code>
                — không ảnh hưởng bất kỳ user nào khác.
              </div>
            </div>
            <div class="info-card info-green">
              <div class="info-icon">🔑</div>
              <div class="info-body">
                <strong>Bảo mật Token</strong><br>
                Bot token & API key được mã hóa <strong>AES-256-GCM</strong> trước khi ghi vào
                config.json. Key quản lý bởi KMS. Staff không thể đọc token của user.
              </div>
            </div>
          </div>
        </div>

        <!-- Encryption snippet -->
        <div class="section-title" style="font-size:.9rem"><span>🛡</span> Encryption tại Rest</div>
        <div class="enc-box" style="margin-bottom:1.25rem">
<span class="enc-c0"># config.json tokens → AES-256-GCM (key per user, stored in KMS)</span>
<span class="enc-c1">const</span> encrypted = <span class="enc-c2">await</span> kms.encrypt(userToken, { keyId: <span class="enc-c3">\`user/\${userId}\`</span> });
<span class="enc-c1">await</span> db.updateChannelConfig(userId, { tokenEnc: encrypted });

<span class="enc-c0"># openclaw.db → SQLCipher hoặc encrypt ở volume level (LUKS)</span>
<span class="enc-c0"># attachments → Server-side encryption trên S3/R2</span>
        </div>

        <!-- Lifecycle cards -->
        <div class="section-title" style="font-size:.9rem"><span>⏱</span> Vòng đời dữ liệu</div>
        <div class="lifecycle-grid">
          ${[
            { icon:'🚀', label:'Container Start',  color:'#1d4ed8',
              desc:'Docker mount volume vào /app/data, SQLite mở file .db, load config.' },
            { icon:'💤', label:'Container Sleep',  color:'#d97706',
              desc:'SQLite flush WAL journal, container dừng. File .db vẫn tồn tại trên Host.' },
            { icon:'⚡', label:'Container Wake',   color:'#16a34a',
              desc:'Docker start lại, mount cùng volume, load đúng data cũ — không mất gì.' },
            { icon:'🗑',  label:'Container Delete', color:'#dc2626',
              desc:'Container xóa nhưng named volume vẫn còn — cần xóa volume riêng nếu muốn.' },
            { icon:'👤', label:'User Delete',      color:'#7c3aed',
              desc:'Control Plane xóa container + volume. Data hoàn toàn xóa trong 30 ngày.' },
          ].map(item => html`
            <div class="lifecycle-card" style="border-color:${item.color}33">
              <div class="lc-icon">${item.icon}</div>
              <div class="lc-label">${item.label}</div>
              <div class="lc-desc">${item.desc}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

customElements.define('tab-storage', TabStorage);
