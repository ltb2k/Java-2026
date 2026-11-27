# 🍄 Hệ Thống Quản Lý Trồng Nấm Thông Minh — Java-2026

> **Mushroom IoT Smart Farm Management System**  
> Backend: **Java 21 + Spring Boot 3.3** | Frontend: **React + Vite** | Mobile: **Flutter** | IoT: **ESP32 + MQTT**

---

## 📁 Cấu Trúc Dự Án

```
Java-2026/
├── backend-java/        ← Spring Boot Java Backend (port 5000)
│   ├── src/main/java/vn/edu/mushroom/
│   │   ├── controller/  ← REST Controllers
│   │   ├── service/     ← Business Logic
│   │   ├── repository/  ← Spring Data JPA
│   │   ├── entity/      ← JPA Entities
│   │   ├── dto/         ← Request/Response DTOs
│   │   ├── config/      ← Security, JWT, OpenAPI
│   │   ├── mqtt/        ← MQTT IoT Integration
│   │   └── exception/   ← Global Exception Handling
│   ├── pom.xml
│   ├── Dockerfile
│   └── docker-compose.yml  ← Backend-only compose
│
├── frontend-web/        ← React + Vite Web Admin (port 3000)
│   ├── src/pages/       ← Dashboard, Rooms, Devices, Harvest...
│   ├── package.json
│   └── Dockerfile
│
├── mobile/              ← Flutter Mobile App (Customer)
│   ├── lib/
│   └── pubspec.yaml
│
├── iot/                 ← ESP32 Firmware (Arduino)
│   └── mushroom_iot/
│
├── database/
│   ├── schema.sql       ← PostgreSQL schema
│   └── seed.sql         ← Seed data
│
├── docs/
│   └── SRS.md           ← Software Requirements Specification
│
└── docker-compose.yml   ← Full-stack compose (all services)
```

---

## 🚀 Khởi Chạy Nhanh (Docker Compose)

### Yêu Cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows)
- Git

### 1. Clone & Cấu Hình

```powershell
git clone https://github.com/ltb2k/Java-2026.git
cd Java-2026

# Tạo file .env từ mẫu
cp backend-java\.env.example .env
```

Chỉnh sửa `.env`:

```env
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_very_long_jwt_secret_at_least_64_chars
MQTT_USERNAME=
MQTT_PASSWORD=
```

### 2. Chạy Toàn Bộ Stack

```powershell
docker-compose up -d --build
```

Các service sẽ khởi chạy theo thứ tự: **PostgreSQL → Mosquitto MQTT → Backend Java → Frontend**

| Service   | URL                                    |
|-----------|----------------------------------------|
| Backend   | http://localhost:5000                  |
| Swagger   | http://localhost:5000/swagger-ui/index.html |
| Frontend  | http://localhost:3000                  |
| MQTT      | tcp://localhost:1883                   |

---

## 🔧 Khởi Chạy Thủ Công (Development)

### Backend Java Spring Boot

**Yêu Cầu:** Java 21+, Maven 3.9+, PostgreSQL 16+

```powershell
# 1. Chạy PostgreSQL (nếu chưa có)
docker-compose up -d postgres mosquitto

# 2. Tạo file .env trong backend-java/
cp backend-java\.env.example backend-java\.env
# Chỉnh sửa backend-java\.env với thông tin database

# 3. Build và chạy
cd backend-java
mvn clean package
java -jar target\backend-java-2.0.0.jar
```

### Frontend React

**Yêu Cầu:** Node.js 20+

```powershell
cd frontend-web
npm install
npm run dev
# → http://localhost:5173
```

### Mobile Flutter

**Yêu Cầu:** Flutter SDK 3.x, Android Studio / Xcode

```powershell
cd mobile
flutter pub get
flutter run
```

---

## 🔌 API Chính

| Module            | Endpoint                     | Mô tả                     |
|-------------------|------------------------------|---------------------------|
| Auth              | `POST /api/v1/auth/login`    | Đăng nhập, lấy JWT        |
| Auth              | `POST /api/v1/auth/register` | Đăng ký tài khoản         |
| Dashboard         | `GET /api/v1/dashboard`      | Thống kê tổng quan        |
| Rooms             | `GET /api/v1/rooms`          | Danh sách phòng trồng     |
| Trays             | `GET /api/v1/trays`          | Danh sách khay            |
| Devices           | `GET /api/v1/devices`        | Thiết bị IoT              |
| Sensors           | `POST /api/v1/sensors/ingest`| Nhận dữ liệu cảm biến     |
| Rentals           | `GET /api/v1/rentals`        | Quản lý thuê phòng        |
| Harvest           | `GET /api/v1/harvest`        | Thu hoạch                 |
| Alerts            | `GET /api/v1/alerts`         | Cảnh báo                  |
| Users             | `GET /api/v1/users`          | Quản lý người dùng        |

📖 **Swagger UI đầy đủ:** http://localhost:5000/swagger-ui/index.html

---

## 🔐 Phân Quyền

| Role     | Quyền                                              |
|----------|----------------------------------------------------|
| `ADMIN`  | Toàn quyền — quản lý user, phòng, thiết bị, gói   |
| `STAFF`  | Quản lý phòng, thiết bị, thu hoạch, cảnh báo       |
| `CUSTOMER` | Xem phòng thuê của mình, tiến độ trồng           |

---

## 🌡️ MQTT — IoT ESP32

Backend lắng nghe MQTT topics từ ESP32:

| Topic                           | Hướng          | Nội dung              |
|---------------------------------|----------------|-----------------------|
| `mushroom/{deviceId}/telemetry` | ESP32 → Server | Nhiệt độ, độ ẩm, CO₂ |
| `mushroom/{deviceId}/command`   | Server → ESP32 | Lệnh điều khiển       |
| `mushroom/{deviceId}/ack`       | ESP32 → Server | Xác nhận lệnh         |

---

## 🗄️ Database

- **PostgreSQL 16**
- Schema: [`database/schema.sql`](database/schema.sql)
- Seed data: [`database/seed.sql`](database/seed.sql)

---

## 🧪 Tests

```powershell
cd backend-java
mvn test
# 16 tests — 0 failures
```

---

## 📱 Nhánh Git

| Nhánh    | Nội dung                          |
|----------|-----------------------------------|
| `main`   | Tổng hợp toàn bộ — **production** |
| `be`     | Backend Java Spring Boot          |
| `fe`     | Frontend React + Vite             |
| `mobile` | Flutter Mobile App                |
| `iot`    | ESP32 Firmware                    |

---

## 🛠️ Công Nghệ

- **Backend:** Java 21, Spring Boot 3.3.5, Spring Security, JWT, Spring Data JPA, PostgreSQL, Eclipse Paho MQTT, Springdoc OpenAPI
- **Frontend:** React 18, Vite, Tailwind CSS
- **Mobile:** Flutter 3.x, Dart
- **IoT:** ESP32, Arduino, MQTT
- **DevOps:** Docker, Docker Compose, GitHub Actions
