# Web Demo SPA — Interactive Tech Guides

Project này chứa các bản demo tương tác để học về các công nghệ như Docker, SaaS Architecture, và Database Management.

## 🚀 Các ứng dụng có sẵn

### 1. OpenClaw SaaS Dashboard
Một giao diện quản trị SaaS hiện đại được thiết kế theo phong cách Black & White (Shadcn-inspired).
- **Tính năng**: Quản lý container, theo dõi tài nguyên server, mô phỏng Auth & Database.
- **Cách truy cập**: Mở file `index.html` tại root.

### 2. Docker Interactive Guide
Hướng dẫn trực quan về cách hoạt động của Docker.
- **Cách truy cập**: Mở file `docker.html`.

## 💻 Cách chạy local

Sử dụng Python để chạy web server tại thư mục root:

```bash
python -m http.server 8080
```

Sau đó truy cập: [http://localhost:8080](http://localhost:8080)

---
*Cấu trúc project đã được tối giản với chỉ 1 file index.html duy nhất tại root làm cổng vào cho OpenClaw SaaS.*
