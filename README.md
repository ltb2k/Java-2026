# 🍄 Hệ Thống Quản Lý Trồng Nấm Thông Minh — Java-2026

> **Mushroom IoT Smart Farm Management System**  
> Backend: **Java 21 + Spring Boot 3.3.5** | Database: **PostgreSQL 16** | Frontend: **React 19 + Vite 8 + Tailwind CSS 4** | Mobile: **Flutter** | IoT: **MQTT Mosquitto + ESP32**

---

## 📁 Cấu Trúc Dự Án

```text
Java-2026/
├── backend-java/            ← Backend Java Spring Boot 3.3.5 (port 5001)
│   ├── src/main/java/vn/edu/mushroom/
│   │   ├── config/          ← SecurityConfig, JwtAuthFilter, JwtService, OpenApiConfig
│   │   ├── controller/      ← 12 REST Controllers (/api/*, /health, /swagger-ui)
│   │   ├── dto/             ← Request & Response DTOs
│   │   ├── entity/          ← JPA Entities & Enums
│   │   ├── exception/       ← GlobalExceptionHandler, AppException
│   │   ├── repository/      ← 14 Spring Data JPA Repositories
│   │   └── service/         ← Business Logic & MqttService
│   ├── src/main/resources/application.yml
│   ├── src/test/resources/application-test.yml
│   ├── .env.example
│   ├── pom.xml
│   ├── Dockerfile
│   └── docker-compose.yml   ← Compose riêng cho PostgreSQL + Mosquitto + Backend
│
├── frontend-web/            ← React 19 + Vite 8 Web App (Docker port 3000 / Dev port 5173)
│   ├── src/services/api.js  ← API client tập trung (JWT + VITE_API_URL)
│   ├── src/pages/           ← Auth, Dashboard, Rooms & Trays, Devices, Thresholds, Growth, Harvest, Rentals, Packages, Users, CustomerPortal
│   ├── nginx.conf           ← Reverse proxy /api/ → http://backend:5001
│   ├── Dockerfile
│   └── vite.config.js       ← Dev proxy /api → http://localhost:5001
│
├── mobile/                  ← Flutter Mobile App (Customer)
│   ├── lib/services/api_service.dart
│   ├── lib/screens/
│   └── pubspec.yaml
│
├── iot/                     ← ESP32 Firmware (Arduino)
│   └── esp32/mushroom_sensor.ino
│
├── database/
│   ├── schema.sql           ← PostgreSQL schema
│   └── seed.sql             ← Dữ liệu khởi tạo ban đầu
│
├── docs/
│   └── SRS.md               ← Software Requirements Specification
│
├── .env.example             ← Mẫu biến môi trường cho Docker Compose gốc
└── docker-compose.yml       ← Full-stack Docker Compose (tất cả dịch vụ)
```

---

## 🚀 Chạy Toàn Bộ Hệ Thống Bằng Docker (Khuyên Dùng)

### Yêu Cầu Trên Windows
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (đang chạy)
- [Git](https://git-scm.com/downloads)

### 1. Clone & Tạo File `.env` (PowerShell)

```powershell
git clone https://github.com/ltb2k/Java-2026.git
cd Java-2026

# Tạo file .env ở thư mục gốc từ .env.example
Copy-Item .env.example .env
```

Mở `.env` và điền mật khẩu PostgreSQL (hoặc dùng giá trị mặc định trong `docker-compose.yml` khi chạy local):

```env
POSTGRES_PASSWORD=mushroom123
```

### 2. Khởi Động Toàn Bộ Stack

```powershell
docker compose up -d --build
```

Thứ tự khởi động tự động: **`mushroom-postgres` (healthy) → `mushroom-mosquitto` → `mushroom-backend-java` (healthy) → `mushroom-frontend-web`**.

### 3. Địa Chỉ Truy Cập Hệ Thống

| Dịch vụ | Container | Port / URL |
|---|---|---|
| **Frontend Web** | `mushroom-frontend-web` | http://localhost:3000 |
| **Backend Java API** | `mushroom-backend-java` | http://localhost:5001 |
| **Swagger UI** | `mushroom-backend-java` | http://localhost:5001/swagger-ui/index.html |
| **OpenAPI JSON** | `mushroom-backend-java` | http://localhost:5001/v3/api-docs |
| **Health Check** | `mushroom-backend-java` | http://localhost:5001/health |
| **PostgreSQL 16** | `mushroom-postgres` | `localhost:5433` (host) → `5432` (container), DB: `mushroom_iot` |
| **MQTT Broker** | `mushroom-mosquitto` | `tcp://localhost:1883`, WebSocket: `ws://localhost:9001` |

---

## 🔧 Chạy Riêng Từng Thành Phần (Development Trên Windows)

### 1. Khởi Động Database & MQTT (qua Docker)

```powershell
docker compose up -d postgres mosquitto
```

### 2. Backend Java Spring Boot

**Yêu cầu:** Java 21 (JDK), Maven 3.9+

```powershell
# Tạo file .env cho backend-java từ mẫu
Copy-Item backend-java\.env.example backend-java\.env

# Build JAR và chạy
cd backend-java
mvn clean package -DskipTests
java -jar target\backend-java-2.0.0.jar
```

> Lưu ý: `backend-java\.env.example` mặc định cấu hình `PORT=5001` và `DATABASE_URL=jdbc:postgresql://localhost:5433/mushroom_iot`. Nếu chạy kèm MQTT trên máy local, đặt `MQTT_BROKER_URL=tcp://localhost:1883`.

### 3. Frontend React + Vite

**Yêu cầu:** Node.js 20+

```powershell
cd frontend-web
npm install
npm run dev
# Truy cập: http://localhost:5173
# Vite tự proxy /api -> http://localhost:5001
```

Build production:

```powershell
cd frontend-web
npm run build
```

### 4. Mobile Flutter

**Yêu cầu:** Flutter SDK 3.x, Android Studio / Android Emulator (hoặc thiết bị Android thật cùng mạng LAN)

```powershell
cd mobile
flutter pub get

# Chạy trên Android Emulator (10.0.2.2 trỏ về localhost máy host)
flutter run --dart-define=API_URL=http://10.0.2.2:5001/api

# Chạy trên điện thoại thật (thay <LAN_IP> bằng IPv4 máy chạy Backend)
flutter run --dart-define=API_URL=http://<LAN_IP>:5001/api
```

---

## 🔑 Tài Khoản Demo (Đã Xác Minh Với PostgreSQL & BCrypt)

| Vai trò (`Role`) | Email | Mật khẩu demo | Phạm vi quyền |
|---|---|---|---|
| `ADMIN` | `admin@mushroom.local` | `Admin@123456` | Toàn quyền: quản lý tài khoản, gói thuê, phòng, khay, thiết bị, thu hoạch, cảnh báo |
| `OPERATOR` | `operator@mushroom.local` | `Operator@123456` | Quản lý phòng, khay, thiết bị IoT, ngưỡng môi trường, sinh trưởng, thu hoạch, duyệt thuê |
| `CUSTOMER` | `customer@mushroom.local` | `Customer@123456` | Xem gói thuê, gửi yêu cầu thuê, liên kết mã khay, theo dõi khay & môi trường của mình |

> Khi chạy Frontend ở chế độ **development** (`npm run dev` tại `http://localhost:5173`), màn hình đăng nhập hiển thị sẵn khối **Tài khoản đăng nhập nhanh** để tự động điền email và mật khẩu. Trong bản **production** (`http://localhost:3000`), khối này được ẩn để đảm bảo an toàn.

---

## 🔌 Danh Sách API Chính (Prefix `/api`)

Tất cả endpoint nghiệp vụ dùng prefix `/api` (không dùng `/api/v1`).

| Module | Endpoints chính | Quyền yêu cầu |
|---|---|---|
| **Health & Docs** | `GET /`, `GET /health`, `GET /swagger-ui/index.html`, `GET /v3/api-docs` | Công khai (`permitAll`) |
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/verify-email` | Công khai (`permitAll`) |
| **Profile** | `GET /api/auth/me`, `PUT /api/auth/me`, `PUT /api/auth/change-password` | Đã đăng nhập (JWT) |
| **Dashboard** | `GET /api/dashboard/summary` | Đã đăng nhập (JWT) |
| **Rooms** | `GET /api/rooms`, `POST /api/rooms`, `GET/PUT/DELETE /api/rooms/{id}` | `ADMIN`, `OPERATOR` |
| **Trays & Growth** | `GET /api/trays`, `GET /api/trays/{id}`, `GET /api/trays/{id}/growth-logs` | Đã đăng nhập (Customer chỉ thấy khay mình thuê) |
| **Trays (Quản lý)** | `POST /api/trays`, `PUT/DELETE /api/trays/{id}`, `PUT /api/trays/{id}/stage` | `ADMIN`, `OPERATOR` |
| **Devices & IoT** | `GET/POST /api/devices`, `GET/PUT/DELETE /api/devices/{id}`, `POST /api/devices/{id}/command`, `GET /api/devices/{id}/commands` | `ADMIN`, `OPERATOR` |
| **Sensors** | `GET /api/sensors/latest`, `GET /api/sensors/history` | Đã đăng nhập |
| **Sensors (Ingest)** | `POST /api/sensors` | `ADMIN`, `OPERATOR` |
| **Alerts & Thresholds** | `GET /api/alerts`, `PUT /api/alerts/{id}/read`, `PUT /api/alerts/{id}/resolve`, `GET /api/alerts/thresholds`, `PUT /api/alerts/thresholds/{metric}` | `GET /api/alerts`: đã đăng nhập; các thao tác quản lý: `ADMIN`, `OPERATOR` |
| **Rentals** | `GET /api/rentals`, `GET /api/rentals/{id}`, `POST /api/rentals/{id}/cancel` | Đã đăng nhập |
| **Rentals (Customer)** | `POST /api/rentals`, `POST /api/rentals/link` | `CUSTOMER` |
| **Rentals (Duyệt/Gán)** | `POST /api/rentals/{id}/approve`, `POST /api/rentals/{id}/reject`, `POST /api/rentals/{id}/assign-trays` | `ADMIN`, `OPERATOR` |
| **Packages** | `GET /api/packages`, `GET /api/packages/{id}` | Công khai (`permitAll`) |
| **Packages (Quản trị)** | `POST /api/packages`, `PUT/DELETE /api/packages/{id}` | `ADMIN` |
| **Harvests** | `GET /api/harvests`, `GET /api/harvests/{id}` | Đã đăng nhập |
| **Harvests (Quản lý)** | `POST /api/harvests`, `PUT /api/harvests/{id}/record` | `ADMIN`, `OPERATOR` |
| **Users** | `GET/POST /api/users`, `GET/PUT /api/users/{id}`, `PUT /api/users/{id}/reset-password` | `ADMIN` |

---

## 🌡️ MQTT & IoT ESP32

### MQTT Topics Trong `MqttService.java`

| Topic | Hướng | Mô tả |
|---|---|---|
| `mushroom/telemetry/#` | ESP32 → Backend | Backend subscribe để nhận dữ liệu cảm biến (`TEMPERATURE`, `HUMIDITY`, `CO2`) và lưu PostgreSQL |
| `mushroom/devices/{deviceId}/commands` | Backend → ESP32 | Backend publish lệnh điều khiển thiết bị (QoS 1, timeout chờ ACK 10 giây) |
| `mushroom/devices/+/ack` | ESP32 → Backend | Backend subscribe để nhận phản hồi xác nhận lệnh (`command_id`) từ thiết bị |

> **Lưu ý về firmware `iot/esp32/mushroom_sensor.ino`:** File firmware hiện tại trong `iot/esp32/` đang sử dụng HTTP mẫu (`http://192.168.1.100:5000/api/sensors/ingest`) từ phiên bản trước; khi tích hợp với Backend Java hiện tại, cần trỏ về `POST http://<SERVER_IP>:5001/api/sensors` (kèm JWT) hoặc publish MQTT vào topic `mushroom/telemetry/...` trên broker port `1883`.

---

## 🧪 Kiểm Thử & Kiểm Tra Log

### Chạy Test Backend (H2 In-Memory Profile `test`)

```powershell
cd backend-java
mvn clean test
# Kết quả: 16 tests run, 0 failures, 0 errors
```

### Kiểm Tra Trạng Thái & Log Docker

```powershell
# Xem trạng thái các container
docker compose ps

# Xem log từng dịch vụ
docker logs mushroom-backend-java --tail 50
docker logs mushroom-frontend-web --tail 30
docker logs mushroom-postgres --tail 30
docker logs mushroom-mosquitto --tail 30
```

### Kiểm Tra Nhanh Kết Nối API & MQTT

```powershell
# Kiểm tra Health & kết nối MQTT
Invoke-RestMethod http://localhost:5001/health

# Publish thử 1 bản tin MQTT telemetry
docker exec mushroom-mosquitto mosquitto_pub -h localhost -t "mushroom/telemetry/room1" -m '{"room_id":1,"sensor_type":"TEMPERATURE","value":26.5,"unit":"°C"}'
```

---

## 🛠️ Xử Lý Lỗi Thường Gặp Trên Windows

1. **Port `5433`, `5001`, `3000` hoặc `1883` đã bị chiếm:**
   - Kiểm tra tiến trình đang chiếm port: `netstat -ano | Select-String ":5001|:5433|:3000|:1883"`
   - Nếu có stack Docker cũ của dự án đang chạy từ `backend-java/`, dừng stack cũ (không dùng `-v` để giữ nguyên dữ liệu): `docker compose -p backend-java down` rồi chạy lại `docker compose up -d`.
2. **Mất dữ liệu hoặc muốn giữ nguyên PostgreSQL khi restart:**
   - Tuyệt đối **không** chạy `docker compose down -v` vì `-v` sẽ xóa volume `backend-java_pgdata`. Chỉ dùng `docker compose down` hoặc `docker compose restart`.
3. **Frontend báo không kết nối được Backend khi chạy `npm run dev`:**
   - Đảm bảo `mushroom-backend-java` đang chạy tại `http://localhost:5001/health` (hoặc chạy `java -jar target\backend-java-2.0.0.jar`).

---

## 🌿 Các Nhánh Git Hiện Có

| Nhánh | Nội dung |
|---|---|
| `main` | Nhánh tổng hợp chính thức: `backend-java/`, `frontend-web/`, `mobile/`, `iot/`, `database/`, `docs/` |
| `be` | Phát triển Backend Java Spring Boot (`backend-java/`) |
| `fe` | Phát triển Frontend React + Vite (`frontend-web/`) |
| `mobile` | Phát triển ứng dụng Mobile Flutter (`mobile/`) |
| `develop` | Nhánh khởi tạo ban đầu (`README.md`, `docs/`) |
| `iot` | Nhánh khởi tạo IoT (`README.md`, `docs/`) |
