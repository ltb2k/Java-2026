# HƯỚNG DẪN CHẠY PROJECT JAVA-2026

## Yêu cầu
- Docker Desktop
- Node.js
- Git (nếu clone từ GitHub)

## Cách chạy

Mở project `Java-2026`, sau đó mở 3 Terminal.

### Terminal 1 — Database

```powershell
cd Java-2026
docker compose up -d
```

### Terminal 2 — Backend

```powershell
cd Java-2026\backend
npm run dev
```

Backend chạy tại:

```text
http://localhost:5000
```

### Terminal 3 — Web

```powershell
cd Java-2026\web-admin
npm run dev
```

Web chạy tại:

```text
http://localhost:5173
```

Mở trình duyệt vào:

```text
http://localhost:5173
```

## Tài khoản Admin

```text
Email: admin@mushroom.local
Password: Admin@123
```

## Kiểm tra nhanh

Nếu Docker đã chạy và Backend/Web đều báo `running` thì mở:

```text
http://localhost:5173
```

## Lưu ý

- Không chạy `docker compose` bên trong `backend` hoặc `web-admin`.
- `docker compose up -d` phải chạy tại thư mục gốc `Java-2026`.
- Không cần cài PostgreSQL riêng nếu Docker Compose đã chạy PostgreSQL.
- Nếu Web hoặc Backend báo thiếu package (`node_modules` chưa có), chạy `npm install` một lần trong thư mục tương ứng:
  - `Java-2026\backend`
  - `Java-2026\web-admin`
