# 2nd K.A.T 2026 - Landing Page & CMS

Trang đích chính thức và hệ thống Quản lý Đăng ký tham dự Hội thảo Đào tạo Kỹ Năng Nâng Cao Hàn – Việt (2nd K.A.T 2026 - KBIT Association).

## 🚀 Tính Năng Nổi Bật

- **Landing Page Đẳng Cấp**:
  - Giao diện Midnight Gold chuẩn y khoa quốc tế.
  - Tối ưu 100% hiển thị cho máy tính và thiết bị di động.
  - Form đăng ký trực tuyến kết nối với toàn bộ các nút CTA trên trang.
  - Tự động sinh mã vé điện tử (`KAT-xxxx`).
- **Tương Tác Trực Tuyến**:
  - Widget hỗ trợ trực tuyến 24/7 & box tư vấn.
  - Đăng ký nhận bản tin y khoa & tài liệu hội thảo qua Email.
- **CMS Quản Trị Tích Hợp (`/admin`)**:
  - Bảng điều khiển thống kê trực quan.
  - Quản lý danh sách đăng ký, cập nhật trạng thái hồ sơ, ghi chú nội bộ.
  - Xuất dữ liệu ra file Excel / CSV (hỗ trợ tiếng Việt UTF-8 BOM chuẩn).
- **Cơ Sở Dữ Liệu Turso Cloud Serverless**:
  - Lưu trữ vĩnh viễn trên đám mây với Turso (libSQL/SQLite).
  - Tự động fallback về SQLite cục bộ khi chạy offline.
- **Sẵn Sàng Deploy Lên Vercel**:
  - Cấu hình sẵn `vercel.json` và Serverless Function `api/index.js`.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Cục Bộ

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ
npm start
```
- Landing Page: http://localhost:3000
- CMS Admin: http://localhost:3000/admin (Tài khoản: `admin` / `kat2026@admin`)

---

## ☁️ Deploy Lên Vercel

1. Import repository này vào [Vercel](https://vercel.com).
2. Thêm các biến môi trường trong mục **Settings ➜ Environment Variables**:
   - `TURSO_DATABASE_URL`: `libsql://kat-phandu.aws-ap-northeast-1.turso.io`
   - `TURSO_AUTH_TOKEN`: *(Auth Token của Turso)*
   - `ADMIN_TOKEN_KEY`: `KAT_ADMIN_SESSION_TOKEN_2026`
3. Nhấn **Deploy**!
