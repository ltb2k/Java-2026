# Tài khoản thành viên

## Tính năng đã bổ sung
- Màn hình đăng nhập có nút chuyển sang tạo tài khoản thành viên.
- Thành viên đăng ký bằng họ tên, email và mật khẩu (tối thiểu 8 ký tự); số điện thoại không bắt buộc.
- Tài khoản mới luôn nhận role `CUSTOMER`; không cho người đăng ký tự chọn quyền quản trị.
- Sau khi đăng ký thành công, quay lại đăng nhập bằng tài khoản vừa tạo.

## Chạy thử local
1. Khởi động PostgreSQL và backend theo `HUONG_DAN_CHAY.md`.
2. Đảm bảo đã chạy `database/schema.sql` và `database/seed.sql` để có các role.
3. Chạy web-admin bằng `npm run dev` trong thư mục `web-admin`.
4. Mở trang web, chọn **Chưa có tài khoản? Đăng ký thành viên**.

## Đưa lên mạng
Đây là mã nguồn đã sửa, chưa tự động được xuất bản lên Internet. Khi deploy:
- Backend: đặt `DATABASE_URL`, `JWT_SECRET` (chuỗi bí mật ngẫu nhiên dài) và `CORS_ORIGIN` là URL web production.
- Frontend Vercel: đặt `VITE_API_URL` thành URL backend production kèm `/api`, ví dụ `https://ten-backend.onrender.com/api`.
- Chạy schema và seed trên database production trước lần đăng nhập đầu tiên.
- Không commit `.env` hoặc mật khẩu thật lên GitHub.
- Đổi mật khẩu admin demo trước khi public hệ thống.
