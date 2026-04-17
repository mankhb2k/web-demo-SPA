/**
 * tab-database.js
 * Tab 6: Cơ sở dữ liệu & Auth — Mô phỏng Schema quản lý xác thực và user state.
 */
import { LitElement, html } from 'https://esm.sh/lit@3';

class TabDatabase extends LitElement {
  static properties = {
    users: { type: Array },
  };

  createRenderRoot() { return this; }

  constructor() {
    super();
    this.users = [];
  }

  render() {
    return html`
      <div class="anim-slide">
        <div class="section-title">
          <iconify-icon icon="lucide:server-cog" style="margin-right: .5rem; color: #fbbf24;"></iconify-icon>
          Thiết kế Cơ sở dữ liệu & Xác thực (Auth)
        </div>

        <div class="info-card info-blue" style="margin-bottom: 1.5rem">
          <div class="info-icon"><iconify-icon icon="lucide:shield-check"></iconify-icon></div>
          <div class="info-body">
            <strong>Tiêu chuẩn bảo mật (Better-Auth / NextAuth)</strong><br>
            Cơ sở dữ liệu trung tâm (PostgreSQL) quản lý định danh người dùng. Mật khẩu được băm (hash) bằng <strong>Argon2id</strong>. 
            Xác thực OAuth2 qua Google/GitHub tự động liên kết tài khoản. Các Session dùng <em>HttpOnly Secure Cookies</em> để tránh XSS.
          </div>
        </div>

        <div class="erd-section-label">
          <iconify-icon icon="lucide:shield" style="color:#60a5fa"></iconify-icon>
          Auth Tables (Better-Auth)
        </div>
        <div class="erd-container">
          <!-- User Table -->
          <div class="table-box">
            <div class="table-header core">
              <iconify-icon icon="lucide:users"></iconify-icon> users
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name">email</div><div class="col-type">VARCHAR (Unique)</div>
            </div>
            <div class="table-row">
              <div class="col-name">password_hash</div><div class="col-type">TEXT (Null if OAuth)</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>plan_id</div><div class="col-type">UUID → plans</div>
            </div>
            <div class="table-row">
              <div class="col-name">status</div><div class="col-type">ENUM ('active', 'banned')</div>
            </div>
            <div class="table-row">
              <div class="col-name">created_at</div><div class="col-type">TIMESTAMP</div>
            </div>
          </div>

          <!-- Accounts Table -->
          <div class="table-box">
            <div class="table-header auth">
              <iconify-icon icon="lucide:external-link"></iconify-icon> accounts <span style="font-weight:400; font-size:.65rem; opacity:.7">(OAuth)</span>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>user_id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name">provider_id</div><div class="col-type">VARCHAR ('google')</div>
            </div>
            <div class="table-row">
              <div class="col-name">provider_account_id</div><div class="col-type">VARCHAR</div>
            </div>
          </div>

          <!-- Sessions Table -->
          <div class="table-box">
            <div class="table-header auth">
              <iconify-icon icon="lucide:cookie"></iconify-icon> sessions
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>session_token</div><div class="col-type">VARCHAR</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>user_id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name">expires_at</div><div class="col-type">TIMESTAMP</div>
            </div>
            <div class="table-row">
              <div class="col-name">ip_address</div><div class="col-type">INET</div>
            </div>
          </div>
        </div>

        <div class="erd-section-label" style="margin-top:1rem">
          <iconify-icon icon="lucide:server" style="color:#4ade80"></iconify-icon>
          SaaS Core Tables (PostgreSQL)
        </div>
        <div class="erd-container">
          <!-- Projects table -->
          <div class="table-box">
            <div class="table-header project">
              <iconify-icon icon="lucide:folder"></iconify-icon> projects
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>user_id</div><div class="col-type">UUID → users</div>
            </div>
            <div class="table-row">
              <div class="col-name">name</div><div class="col-type">VARCHAR</div>
            </div>
            <div class="table-row">
              <div class="col-name">status</div><div class="col-type">ENUM (creating, running, stopped, error)</div>
            </div>
            <div class="table-row">
              <div class="col-name">container_id</div><div class="col-type">VARCHAR</div>
            </div>
            <div class="table-row">
              <div class="col-name">port</div><div class="col-type">INTEGER</div>
            </div>
            <div class="table-row">
              <div class="col-name">domain</div><div class="col-type">VARCHAR</div>
            </div>
          </div>

          <!-- Instances table -->
          <div class="table-box">
            <div class="table-header instance">
              <iconify-icon icon="lucide:box"></iconify-icon> instances
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>project_id</div><div class="col-type">UUID → projects</div>
            </div>
            <div class="table-row">
              <div class="col-name">container_id</div><div class="col-type">VARCHAR</div>
            </div>
            <div class="table-row">
              <div class="col-name">cpu_limit</div><div class="col-type">DECIMAL (0.5)</div>
            </div>
            <div class="table-row">
              <div class="col-name">ram_limit</div><div class="col-type">INTEGER (MB)</div>
            </div>
            <div class="table-row">
              <div class="col-name">status</div><div class="col-type">ENUM (running, stopped, error)</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>node_id</div><div class="col-type">UUID → nodes</div>
            </div>
          </div>

          <!-- Plans table -->
          <div class="table-box">
            <div class="table-header plan">
              <iconify-icon icon="lucide:gem"></iconify-icon> plans
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name">name</div><div class="col-type">VARCHAR ('Free', 'Pro')</div>
            </div>
            <div class="table-row">
              <div class="col-name">price</div><div class="col-type">DECIMAL</div>
            </div>
            <div class="table-row">
              <div class="col-name">max_projects</div><div class="col-type">INTEGER</div>
            </div>
            <div class="table-row">
              <div class="col-name">cpu_limit</div><div class="col-type">DECIMAL</div>
            </div>
            <div class="table-row">
              <div class="col-name">ram_limit</div><div class="col-type">INTEGER</div>
            </div>
          </div>

          <!-- Usage logs table -->
          <div class="table-box">
            <div class="table-header usage">
              <iconify-icon icon="lucide:bar-chart-2"></iconify-icon> usage_logs
            </div>
            <div class="table-row">
              <div class="col-name"><span class="pk">🔑</span>id</div><div class="col-type">UUID</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>user_id</div><div class="col-type">UUID → users</div>
            </div>
            <div class="table-row">
              <div class="col-name"><span class="fk">🔗</span>project_id</div><div class="col-type">UUID → projects</div>
            </div>
            <div class="table-row">
              <div class="col-name">requests</div><div class="col-type">INTEGER</div>
            </div>
            <div class="table-row">
              <div class="col-name">tokens_used</div><div class="col-type">INTEGER</div>
            </div>
            <div class="table-row">
              <div class="col-name">cost</div><div class="col-type">DECIMAL</div>
            </div>
            <div class="table-row">
              <div class="col-name">timestamp</div><div class="col-type">TIMESTAMP</div>
            </div>
          </div>
        </div>



        <div class="section-title" style="font-size:.9rem; margin-top:2rem;">
          <iconify-icon icon="lucide:database" style="margin-right: .5rem; color: #4ade80;"></iconify-icon>
          Live Database View: Bảng "users"
        </div>

        <div class="db-pane">
          <div class="db-header">
            <div><iconify-icon icon="lucide:table" style="margin-right:.4rem;"></iconify-icon> public.users</div>
            <div style="font-weight:400; font-size:.7rem; color:#60a5fa">${this.users.length} rows</div>
          </div>
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>id (pkt)</th>
                  <th>email</th>
                  <th>password_hash</th>
                  <th>tier</th>
                  <th>created_at</th>
                </tr>
              </thead>
              <tbody>
                ${this.users.length === 0 ? html`
                  <tr><td colspan="5" style="text-align:center; padding: 2rem; color:#475569">Bảng rỗng. Cần tạo user mới từ Bảng điều khiển.</td></tr>
                ` : this.users.map(u => html`
                  <tr>
                    <td style="color:#fafafa">${u.id}</td>
                    <td style="color:#e4e4e7">${u.id}@openclaw.local</td>
                    <td><span class="mock-hash">$argon2id$v=19$m=4096,t=3,p...</span></td>
                    <td><span class="db-badge">${u.tier || 'Free'}</span></td>
                    <td>${u.createdAt}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>

        <div class="section-title" style="font-size:.9rem; margin-top:2rem;">
          <iconify-icon icon="lucide:terminal-square" style="margin-right: .5rem; color: #a78bfa;"></iconify-icon>
          Luồng xử lý (Control Plane / Next.js API)
        </div>
        
        <div class="auth-flow">
<span class="h-cmt">// 1. User đăng nhập qua API (Next.js server action)</span>
<span class="h-key">const</span> session = <span class="h-key">await</span> auth.verifyCredentials(email, password);
<span class="h-key">if</span> (!session) <span class="h-key">return</span> { <span class="h-obj">error</span>: <span class="h-str">"Invalid credentials"</span> };

<span class="h-cmt">// 2. Lấy thông tin subscription / tier</span>
<span class="h-key">const</span> user = <span class="h-key">await</span> db.query(<span class="h-str">"SELECT tier FROM users WHERE id = $1"</span>, [session.user.id]);

<span class="h-cmt">// 3. Middleware cấp phép tạo container (Giới hạn Free)</span>
<span class="h-key">const</span> limits = { <span class="h-str">'Free'</span>: 2, <span class="h-str">'Pro'</span>: 10 };

<span class="h-key">const</span> botCount = <span class="h-key">await</span> db.query(<span class="h-str">"SELECT count(*) FROM bots WHERE user_id = $1"</span>, [session.user.id]);

<span class="h-key">if</span> (user.tier === <span class="h-str">'Free'</span> && botCount >= limits[<span class="h-str">'Free'</span>]) {
  <span class="h-key">throw new</span> <span class="h-obj">ApiError</span>(403, <span class="h-str">"Bạn đã đạt giới hạn 2 container cho gói Free. Vui lòng nâng cấp."</span>);
}

<span class="h-cmt">// 4. Nếu hợp lệ -> Gọi Docker SDK spawn container worker</span>
spawnDockerContainer(session.user.id, botConfig);
        </div>

      </div>
    `;
  }
}

customElements.define('tab-database', TabDatabase);
