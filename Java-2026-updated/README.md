# Mushroom Smart Farm - bản chức năng

## Chạy hệ thống

### 1. PostgreSQL
Tại thư mục `D:\java`:
```powershell
docker compose up -d
docker compose ps
```

### 2. Backend
Mở terminal 1:
```powershell
cd D:\java\backend
npm install
npm run dev
```
Backend: `http://localhost:5000`

### 3. Tạo tài khoản Admin nếu chưa có
Mở terminal khác:
```powershell
cd D:\java\backend
node .\scripts\create-admin.js
```
Tài khoản:
- Email: `admin@mushroom.local`
- Password: `Admin@123`

### 4. Web Admin
Mở terminal 3:
```powershell
cd D:\java\web-admin
npm install
npm run dev
```
Mở URL Vite hiện ra, thường là `http://localhost:5173`.

## Chức năng đã nối PostgreSQL
- Đăng nhập JWT.
- Dashboard lấy số liệu thật từ PostgreSQL.
- Khay nuôi: xem, thêm, xóa.
- Phòng trồng: xem, thêm, xóa.
- Dữ liệu cảm biến: xem lịch sử.
- Thiết bị IoT: xem và bật/tắt trạng thái.
- Camera: xem danh sách/trạng thái.
- Thông báo: xem và đánh dấu đã đọc.
- Người dùng: xem và đổi role (Admin).
- Thu hoạch: tạo bản ghi thu hoạch.
- Cài đặt: xem ngưỡng môi trường.

## Lưu ý
Không cần cài PostgreSQL trực tiếp trên Windows nếu đang dùng Docker. PostgreSQL chạy trong container `mushroom-postgres`.
Không chạy `docker compose` trong `web-admin/src`; phải chạy tại thư mục chứa `docker-compose.yml`.
