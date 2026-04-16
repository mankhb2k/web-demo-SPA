/**
 * helpers.js — Constants & pure utility functions
 * Imported by all components via ES module.
 */

export const uid   = () => Math.random().toString(36).slice(2, 6);
export const now   = () => new Date().toLocaleTimeString('vi-VN');
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Danh sách platform hỗ trợ */
export const PLATFORMS = ['Telegram', 'Zalo', 'WhatsApp', 'Discord', 'Slack', 'IRC', 'LINE'];

/** Emoji đại diện mỗi platform */
export const PLATFORM_EMOJI = {
  Telegram: '✈',
  Zalo:     '💬',
  WhatsApp: '📱',
  Discord:  '🎮',
  Slack:    '🔷',
  IRC:      '🖥',
  LINE:     '💚',
};

/** Tab navigation config */
export const TABS = [
  { id: 'dashboard',    label: 'Bảng điều khiển', icon: 'layout-dashboard' },
  { id: 'architecture', label: 'Kiến trúc SaaS',  icon: 'network'          },
  { id: 'database',     label: 'DB & Auth',       icon: 'server-cog'       },
  { id: 'storage',      label: 'Lưu trữ',         icon: 'database'         },
  { id: 'compare',      label: 'So sánh',         icon: 'diff'             },
  { id: 'docker101',    label: 'Docker 101',      icon: 'ship'             },
];

/** Provisioning steps data — dùng trong tab-architecture */
export const PROVISION_STEPS = [
  {
    n: 1, title: 'User mở browser',
    detail: 'Next.js SPA tải trang Dashboard từ CDN/GitHub Pages.',
    code: 'https://app.openclaw.ai → Browser renders React SPA',
  },
  {
    n: 2, title: 'Đăng nhập / Đăng ký',
    detail: 'Better-Auth xử lý OAuth2 (Google/GitHub) hoặc magic link qua email.',
    code: 'POST /api/auth/login → session cookie (httpOnly)',
  },
  {
    n: 3, title: 'Control Plane nhận yêu cầu provisioning',
    detail: 'Fastify API tạo user record trong PostgreSQL, enqueue provisioning job vào BullMQ.',
    code: 'POST /api/provision → queue.add("spawn", { userId })',
  },
  {
    n: 4, title: 'Worker spawn container',
    detail: 'Docker SDK gọi docker run, gắn volume riêng, đặt resource limit.',
    code: 'docker run -d --memory=256m -v /data/${userId}:... openclaw-gateway:v2',
  },
  {
    n: 5, title: 'Gateway health-check',
    detail: 'Control Plane poll GET /health mỗi 2s. Sau khi 200 OK → báo cho frontend.',
    code: 'GET http://127.0.0.1:${port}/health → 200 OK (cold start ~10–20s)',
  },
  {
    n: 6, title: 'User kết nối kênh',
    detail: 'Nhập Bot Token (Telegram) hoặc quét QR (WhatsApp/Zalo) ngay trong browser.',
    code: 'Control Plane gửi token (encrypted) vào Gateway qua IPC/REST',
  },
  {
    n: 7, title: 'WebSocket proxy route',
    detail: 'Nginx sticky-session proxy WebSocket từ browser đến đúng container của user.',
    code: 'wss://app.openclaw.ai/ws/${userId} → gateway-${userId}:3000',
  },
  {
    n: 8, title: 'Bot hoạt động 24/7',
    detail: 'Gateway kết nối Telegram/Zalo/WhatsApp. AI trả lời tự động. Data lưu vào SQLite trong Volume.',
    code: 'Gateway ↔ Telegram/WhatsApp/Discord ↔ OpenAI/Gemini',
  },
  {
    n: 9, title: 'Sleep khi không dùng (Free tier)',
    detail: 'Sau 10 phút idle, Control Plane gửi SIGTERM → container graceful shutdown, RAM giải phóng.',
    code: 'docker stop openclaw-${userId}  # volume vẫn còn nguyên',
  },
  {
    n: 10, title: 'Wake up khi có message mới',
    detail: 'Webhook/push kích hoạt Control Plane → docker start → load state từ Volume → xử lý message.',
    code: 'docker start openclaw-${userId}  # tiếp tục từ lần dừng',
  },
];

/** Dispatch a custom event that bubbles through shadow DOM */
export function dispatch(element, type, detail = {}) {
  element.dispatchEvent(new CustomEvent(type, {
    detail,
    bubbles:  true,
    composed: true,   // cross shadow-DOM boundary
  }));
}
