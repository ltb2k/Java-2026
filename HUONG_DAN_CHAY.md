# HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY PROJECT JAVA-2026 TRÊN WINDOWS

## 1. Giới thiệu

Tài liệu này hướng dẫn các thành viên trong nhóm cài đặt và chạy project **Java-2026 – Hệ thống quản lý trồng nấm thông minh** trên Windows.

**Lưu ý quan trọng:** Project chính là thư mục gốc `Java-2026`. Thư mục `java-rebuild/` là một project riêng, có cấu trúc API và cơ sở dữ liệu khác. Không trộn code giữa hai thư mục.

## 2. Chuẩn bị trước khi chạy

Cần cài đặt các phần mềm sau:

- **Docker Desktop:** dùng để chạy PostgreSQL.
- **Node.js:** phiên bản 20.19 trở lên hoặc 22.12 trở lên.
- **PowerShell:** dùng để nhập lệnh chạy chương trình.
- **Visual Studio Code:** dùng để mở code và terminal.

Sau khi cài đặt, hãy mở Docker Desktop và chờ Docker khởi động hoàn tất.

## 3. Bước 1 – Khởi động cơ sở dữ liệu

### 3.1. Mở terminal tại thư mục gốc

Mở project `Java-2026` bằng VS Code.

Trên thanh menu, chọn **Terminal → New Terminal**. Terminal cần đang ở thư mục gốc của project, ví dụ:

`D:\java`

Nếu terminal chưa ở đúng thư mục, nhập:

```powershell
cd D:\java
```

### 3.2. Chuẩn bị file cấu hình

Kiểm tra xem thư mục gốc đã có file `.env` chưa.

Nếu chưa có, chạy lệnh:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Nếu đã có `.env`, không cần tạo lại vì có thể làm mất cấu hình hiện tại.

Mở file `.env` ở thư mục gốc và điền `POSTGRES_PASSWORD` bằng mật khẩu riêng của máy. Không chia sẻ file này cho người khác.

### 3.3. Chạy PostgreSQL

Trong terminal tại thư mục gốc, chạy:

```powershell
docker compose up -d postgres
```

Sau đó kiểm tra trạng thái:

```powershell
docker compose ps
```

**Kết quả cần đạt:** PostgreSQL đã khởi động và trạng thái sức khỏe là `healthy`.

Nếu mới tạo database bằng volume mới, Docker sẽ tự chạy các file khởi tạo:

- `database/schema.sql`: tạo cấu trúc bảng.
- `database/seed.sql`: thêm dữ liệu ban đầu.

Nếu database đã tồn tại từ trước, Docker giữ lại dữ liệu và không tự chạy lại hai file trên.

**Nếu gặp lỗi:** Kiểm tra Docker Desktop đã chạy chưa, file `.env` đã có `POSTGRES_PASSWORD` chưa và mật khẩu có khớp với database hiện tại không.

Không chạy `docker compose down -v` vì lệnh này có thể xóa dữ liệu database.

## 4. Bước 2 – Cài đặt và chạy backend

Backend là phần xử lý nghiệp vụ, đăng nhập và giao tiếp với database.

### 4.1. Mở terminal thứ hai

Trong VS Code, chọn **Terminal → New Terminal** để mở một terminal mới. Giữ terminal database ở nguyên trạng thái.

Nhập lần lượt:

```powershell
cd D:\java\backend
npm ci
```

Lệnh `npm ci` dùng để cài các thư viện cần thiết cho backend. Chỉ cần cài lại khi thiết lập máy mới hoặc khi cần cài lại thư viện.

### 4.2. Chuẩn bị cấu hình backend

Kiểm tra file `backend/.env`.

Nếu chưa có, tạo từ file mẫu:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Mở `backend/.env` và kiểm tra các cấu hình cần thiết:

- `PORT`: cổng chạy backend, thông thường là `5000`.
- `DATABASE_URL`: địa chỉ kết nối PostgreSQL local, phải khớp với cấu hình database.
- `JWT_SECRET`: khóa bí mật dùng để bảo vệ token đăng nhập; cần là chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
- `CORS_ORIGIN`: địa chỉ frontend, thường là `http://localhost:5173`.

Nếu sử dụng chức năng IoT, cấu hình thêm `IOT_INGEST_KEY` theo hướng dẫn của project.

Không gửi file `backend/.env` lên GitHub hoặc chia sẻ mật khẩu và khóa bí mật trong nhóm chat.

### 4.3. Khởi động backend

Trong terminal thứ hai, chạy:

```powershell
npm run dev
```

Giữ terminal này mở trong suốt quá trình sử dụng hệ thống.

Mở trình duyệt và truy cập:

http://localhost:5000/api/health

**Kết quả cần đạt:** API phản hồi và báo database đã kết nối thành công.

Nếu không truy cập được, hãy kiểm tra thông báo lỗi trong terminal backend trước khi chuyển sang bước tiếp theo.

## 5. Bước 3 – Cài đặt và chạy giao diện web

Frontend là giao diện mà người dùng sử dụng trên trình duyệt.

### 5.1. Mở terminal thứ ba

Trong VS Code, chọn **Terminal → New Terminal**.

Nhập:

```powershell
cd D:\java\web-admin
npm ci
```

Lệnh này cài các thư viện cần thiết cho giao diện web.

### 5.2. Khởi động giao diện

Chạy:

```powershell
npm run dev
```

Giữ terminal thứ ba mở.

Khi terminal hiển thị địa chỉ:

`http://localhost:5173/`

hãy mở địa chỉ này trên trình duyệt để sử dụng hệ thống.

## 6. Bước 4 – Tạo tài khoản và đăng nhập

### 6.1. Tài khoản khách hàng

Tại trang đăng nhập, sử dụng chức năng đăng ký để tạo tài khoản khách hàng mới.

Cài đặt mới không có sẵn tài khoản demo dựng sẵn.

### 6.2. Tài khoản quản trị (Admin)

Nếu cần tài khoản Admin, mở file `backend/.env` và cấu hình:

- `ADMIN_EMAIL`: email đăng nhập.
- `ADMIN_FULL_NAME`: tên hiển thị.
- `ADMIN_PASSWORD`: mật khẩu đủ mạnh.

Sau khi xác nhận backend đang trỏ tới đúng database local, mở terminal tại `D:\java\backend` và chạy:

```powershell
npm run seed:admin
```

Lệnh này dùng để tạo tài khoản quản trị. Không cần chạy lại mỗi lần khởi động project.

## 7. Thứ tự chạy project trong những lần sử dụng tiếp theo

Sau khi cài đặt đầy đủ lần đầu, những lần sau chỉ cần thực hiện các bước sau:

**Terminal 1 – Database:**

```powershell
cd D:\java
docker compose up -d postgres
```

**Terminal 2 – Backend:**

```powershell
cd D:\java\backend
npm run dev
```

**Terminal 3 – Frontend:**

```powershell
cd D:\java\web-admin
npm run dev
```

Sau đó truy cập:

http://localhost:5173/

Không cần chạy lại `npm ci` hoặc `npm run seed:admin` mỗi lần mở project, trừ khi có lý do cụ thể.

## 8. Kiểm tra trước khi bàn giao

Trong terminal backend, chạy:

```powershell
npm test
```

Trong terminal frontend, chạy:

```powershell
npm run build
```

Các bài kiểm thử tích hợp cần PostgreSQL đang chạy và file cấu hình `.env` hợp lệ.

## 9. Lưu ý khi làm việc nhóm

- Không trộn code giữa `Java-2026` và `java-rebuild/`.
- Không commit file `.env`, mật khẩu database, `JWT_SECRET` hoặc `IOT_INGEST_KEY`.
- Không xóa volume database nếu cần giữ dữ liệu.
- Trước khi chạy migration trên database đã có dữ liệu, cần xác nhận đúng database và tạo bản backup.
- Backend không tự chạy migration khi khởi động.

Nếu cần cập nhật cấu trúc database hiện có, chỉ chạy lệnh sau trong thư mục `backend/` sau khi xác nhận đúng database đích:

```powershell
npm run db:migrate
```

Trước khi chạy migration, cần kiểm tra và xử lý các email trùng nhau nếu khác biệt chữ hoa/chữ thường.

---

**Tóm tắt:** Database chạy trước, backend chạy thứ hai, frontend chạy cuối cùng. Khi cả ba phần hoạt động bình thường, mở `http://localhost:5173/` để sử dụng hệ thống.
