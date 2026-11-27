# Mushroom IoT Smart Farm Backend — Java Spring Boot

Hệ thống quản lý nuôi trồng nấm thông minh (Smart Mushroom IoT) – Backend Java Spring Boot 3.3.x & Java 21 LTS.

---

## 1. Tổng quan kiến trúc & Công nghệ

Backend được chuyển đổi hoàn chỉnh từ Node.js/Express sang kiến trúc chuẩn enterprise của Java Spring Boot:

- **Ngôn ngữ & Runtime:** Java 21 LTS
- **Framework:** Spring Boot 3.3.5 (Spring Web, Spring Security 6, Spring Data JPA, Spring Validation)
- **Database:** PostgreSQL (Hỗ trợ H2 in-memory cho Unit/Integration Tests)
- **Authentication & Authorization:** JWT (JJWT 0.12.6) với Stateless Authentication Filter & RBAC (Role-Based Access Control)
- **IoT Communication:** Eclipse Paho MQTT Client v1.2.5 (nhận telemetry từ ESP32 chu kỳ 30s, điều khiển thiết bị chấp hành với cơ chế 10s ACK Timeout)
- **Tài liệu API:** Springdoc OpenAPI 2.6.0 (Swagger UI tại `/api/docs`)
- **Testing:** JUnit 5, Mockito, Spring Boot Test, H2 In-Memory Database

---

## 2. Cấu trúc thư mục

```
backend-java/
├── pom.xml
├── Dockerfile
├── .env.example
├── README.md
└── src/
    ├── main/
    │   ├── java/vn/edu/mushroom/
    │   │   ├── MushroomApplication.java
    │   │   ├── config/             # SecurityConfig, JwtService, JwtAuthFilter, OpenApiConfig
    │   │   ├── controller/         # Auth, User, Room, Tray, Rental, Device, Sensor, Alert, Harvest, Dashboard
    │   │   ├── dto/                # Request & Response DTOs
    │   │   ├── entity/             # JPA Entities (User, Room, Tray, Rental, Device, SensorReading, Alert, ...)
    │   │   │   └── enums/          # Role, UserStatus, RoomStatus, TrayStatus, GrowthStage, SensorType, ...
    │   │   ├── exception/          # AppException, GlobalExceptionHandler
    │   │   ├── repository/         # 14 Spring Data JPA Repositories
    │   │   └── service/            # Core business services & MqttService
    │   └── resources/
    │       ├── application.yml
    │       └── application-test.yml
    └── test/
        └── java/vn/edu/mushroom/   # Unit and integration tests
```

---

## 3. Các module nghiệp vụ đã triển khai

### 3.1. Authentication & RBAC
- Đăng ký tài khoản khách hàng (`POST /api/auth/register`), đăng nhập trả JWT (`POST /api/auth/login`).
- Xác minh email (`POST /api/auth/verify-email`), quản lý hồ sơ (`GET/PUT /api/auth/me`), đổi mật khẩu (`PUT /api/auth/change-password`).
- Khóa tài khoản sau 5 lần nhập sai mật khẩu liên tiếp trong 15 phút.
- Phân quyền: `ADMIN`, `OPERATOR`, `CUSTOMER`. Quản trị viên (`ADMIN`) kế thừa toàn bộ quyền của `OPERATOR`.
- Khách hàng (`CUSTOMER`) được bảo vệ IDOR (chỉ xem được khay, hợp đồng, lịch sử thu hoạch và chỉ số môi trường phòng chứa khay có hợp đồng ACTIVE của mình).

### 3.2. Quản lý phòng & khay trồng
- CRUD phòng trồng (`/api/rooms`) với cơ chế lưu trữ an toàn (soft archive `isArchived = true`) khi đang có khay hoặc thiết bị liên kết, không xóa cứng gây mất dữ liệu.
- CRUD khay trồng (`/api/trays`), kiểm tra trùng mã khay duy nhất.
- Quản lý vòng đời sinh trưởng khay: `PREPARATION → INCUBATION → FRUITING → READY_TO_HARVEST → HARVESTED → COMPLETED`, lưu lịch sử vào `growth_logs`.

### 3.3. Quy trình thuê khay & Mã liên kết 24h
- Khách hàng gửi yêu cầu thuê 1–5 khay (`POST /api/rentals`) ở trạng thái `PENDING`.
- Nhân viên vận hành duyệt (`/approve`) hoặc từ chối (`/reject`).
- Sau khi duyệt, gán khay khả dụng (`/assign-trays`) và cấp **mã liên kết 8 ký tự dùng một lần (hết hạn sau 24 giờ)**.
- Khách hàng nhập mã liên kết (`POST /api/rentals/link`) để kích hoạt hợp đồng sang `ACTIVE`, tự động chuyển trạng thái các khay sang `RENTED` và tính ngày kết thúc hợp đồng theo gói thuê.

### 3.4. Giám sát môi trường & Cảnh báo 2 mẫu liên tiếp
- Nhận dữ liệu cảm biến qua REST (`POST /api/sensors`) và MQTT broker topic `mushroom/telemetry/#`.
- Cơ chế chống trùng lặp theo `message_id`.
- **Logic cảnh báo chuẩn SRS:**
  - Mẫu vượt ngưỡng lần 1: ghi nhận bộ đếm vi phạm, **chưa tạo cảnh báo**.
  - Mẫu vượt ngưỡng lần 2 liên tiếp: tạo hoặc cập nhật cảnh báo `ACTIVE` với mức độ `WARNING` hoặc `DANGER` (nếu vượt quá 25% biên độ).
  - Mẫu bình thường: reset bộ đếm về 0 và tự động đóng (`RESOLVED`) cảnh báo đang mở của phòng và chỉ số đó.

### 3.5. Điều khiển thiết bị & Xác nhận ACK 10 giây
- Nhân viên gửi lệnh điều khiển (`POST /api/devices/{id}/command`).
- Hệ thống gửi lệnh downlink qua MQTT topic `mushroom/devices/{deviceId}/commands` và chờ ACK qua `mushroom/devices/{deviceId}/ack`.
- **Ràng buộc thời gian thực:** Chờ tối đa 10 giây. Nếu không có ACK, chuyển trạng thái lệnh sang `TIMEOUT` và trả về HTTP 504 Gateway Timeout (không bao giờ báo thành công giả).

### 3.6. Thu hoạch nấm
- Lập kế hoạch thu hoạch (`POST /api/harvests`).
- Ghi nhận kết quả thu hoạch (`PUT /api/harvests/{id}/record`) trong database transaction: cập nhật sản lượng, tự động chuyển khay sang giai đoạn `HARVESTED` và ghi nhật ký sinh trưởng.

### 3.7. Dashboard tổng quan
- Thống kê toàn diện trang trại (`GET /api/dashboard/summary`): số phòng, số khay, thiết bị đang bật, hợp đồng đang thuê/chờ duyệt, cảnh báo chưa đọc, số liệu cảm biến mới nhất và hoạt động gần đây.

---

## 4. Hướng dẫn chạy

### Yêu cầu môi trường
- Java 21 LTS (OpenJDK / Eclipse Temurin / Microsoft Build)
- Maven 3.9+
- PostgreSQL 14+

### Bước 1: Cấu hình biến môi trường
Tạo file `.env` hoặc thiết lập biến môi trường:
```bash
PORT=5000
DATABASE_URL=jdbc:postgresql://localhost:5432/mushroom_iot
DATABASE_USER=mushroom
DATABASE_PASSWORD=mushroom123
JWT_SECRET=GodQvW25J10IZ8rSAckQEcG6qe7E9Vw0fW8p6AqcFCFNnl7JFSmaBBNRq8mg9s9y
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
MQTT_BROKER_URL=
```

### Bước 2: Build & Chạy Tests
```bash
cd backend-java
mvn clean test
```

### Bước 3: Khởi động ứng dụng

**Cách 1: Chạy trực tiếp bằng Maven hoặc JAR**
```bash
mvn spring-boot:run
# hoặc sau khi mvn package:
java -jar target/backend-java-2.0.0.jar
```

**Cách 2: Chạy toàn bộ hệ thống bằng Docker Compose**
Hệ thống đi kèm cấu hình Docker Compose sẵn sàng cho cả PostgreSQL, Eclipse Mosquitto MQTT Broker và Backend Java:
```bash
docker compose up -d --build
```

Ứng dụng sẽ chạy tại: `http://localhost:5000`

### Bước 4: Xem tài liệu Swagger UI
Mở trình duyệt truy cập:
`http://localhost:5000/api/docs`
