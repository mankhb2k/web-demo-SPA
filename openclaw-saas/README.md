# OpenClaw SaaS Dashboard — Modern B&W Interface

Giao diện quản trị OpenClaw SaaS được hiện đại hóa theo phong cách Minimalist (Shadcn UI), sử dụng hệ màu Đen - Trắng (Black & White) với độ tương phản cao, tối ưu hóa cho quản lý hạ tầng và container.

## 🚀 Tính năng chính

- **Giao diện hiện đại**: Nền Pure Black (#000000) với các panel Gray-Dark tạo chiều sâu.
- **Quản lý đa người dùng**: Mô phỏng đăng ký user và quản lý container (2 container cho gói Free).
- **Trạng thái Real-time**: Theo dõi CPU, RAM của Server tổng và từng container (tự động cập nhật).
- **Kiến trúc Modular**: CSS được tách biệt hoàn toàn khỏi logic JavaScript.
- **Hướng dẫn Docker 101**: Tích hợp sẵn tab giải thích các khái niệm Docker & lệnh triển khai.

## 🛠 Công nghệ sử dụng

- **Frontend core**: HTML5, Vanilla JavaScript.
- **Framework logic**: [LitElement](https://lit.dev/) (via ESM CDN).
- **Styling**: Vanilla CSS (Modular design).
- **Icons**: [Iconify](https://iconify.design/).

## 💻 Cách chạy Project

Để chạy dự án này trên môi trường local, bạn cần máy tính đã cài đặt **Python**.

1. Mở terminal (Command Prompt, PowerShell hoặc Terminal trên macOS/Linux).
2. Di chuyển vào thư mục chứa dự án:
   ```bash
   cd path/to/openclaw-saas
   ```
3. Chạy lệnh server bằng Python trên cổng **8080**:
   ```bash
   # Nếu dùng Python 3 (Khuyên dùng)
   python -m http.server 8080

   # Hoặc nếu là Python 2
   python -m SimpleHTTPServer 8080
   ```
4. Mở trình duyệt và truy cập địa chỉ:
   [**http://localhost:8080**](http://localhost:8080)

## 📁 Cấu trúc thư mục

- `css/`: Chứa các file style (base, components, app-shell, tabs).
- `js/`:
  - `components/`: Các file JavaScript định nghĩa Web Components.
  - `helpers.js`: Các hàm tiện ích, cấu hình server và state.
- `index.html`: File chạy chính.

---
*Created with ❤️ by Antigravity AI*
