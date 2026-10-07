# Smart Mushroom Cultivation Management System
> Hệ thống quản lý nuôi trồng nấm thông minh tích hợp chức năng cho thuê và giám sát từ xa.

---

## 📌 Giới thiệu đề tài
Hệ thống kết hợp công nghệ **IoT**, ứng dụng di động (**Flutter**) và nền tảng web (**ReactJS**) nhằm:
- Tự động hóa giám sát và điều khiển vi khí hậu nhà trồng nấm (nhiệt độ, độ ẩm, $CO_2$).
- Cung cấp mô hình dịch vụ cho thuê khay trồng (Farming-as-a-Service - FaaS).
- Cho phép khách hàng theo dõi trực tiếp hình ảnh (camera) và thông số sinh trưởng thời gian thực qua điện thoại.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Backend** | Node.js (ExpressJS), RESTful API, MQTT Client, Socket.io |
| **Cơ sở dữ liệu** | PostgreSQL (TimescaleDB cho chuỗi dữ liệu cảm biến) |
| **Web Dashboard** | ReactJS (Admin & Farm Operator) |
| **Mobile App** | Flutter (Customer) |
| **IoT & Phần cứng** | ESP32, SHT30/DHT22 (Nhiệt/Ẩm), SCD30/MQ-135 ($CO_2$), Relay Module |
| **Streaming & Message Broker** | Eclipse Mosquitto (MQTT), MediaMTX (WebRTC/RTSP Camera) |

---

## 🚀 Các tính năng chính

### 1. Phân hệ IoT & Nhà trồng
- Tự động đo đạc định kỳ nhiệt độ, độ ẩm và nồng độ $CO_2$.
- **Cơ chế Fail-safe cục bộ (Edge Computing):** Tự động bật máy phun sương, quạt thông gió khi vượt ngưỡng an toàn kể cả khi mất kết nối máy chủ.
- Hỗ trợ điều khiển thủ công từ xa qua Web/App.

### 2. Dành cho Farm Operator & Administrator (Web)
- Quản lý phòng trồng, khay nấm và cấu hình thiết bị IoT/Camera.
- Giám sát môi trường theo thời gian thực (Dashboard & Alerts).
- Quản lý đơn thuê khay, gói dịch vụ và quy trình thu hoạch/giao nấm.

### 3. Dành cho Khách hàng (Mobile App)
- Đăng ký tài khoản, duyệt và thuê khay nuôi trồng theo chu kỳ.
- Xem trực tiếp thông số môi trường của khay thuê.
- Xem hình ảnh/video camera trực tiếp và clip time-lapse quá trình nấm lớn.
- Đặt yêu cầu thu hoạch và giao hàng tận nơi.

---

## 📁 Cấu trúc thư mục (Dự kiến)

```text
├── backend/            # Mã nguồn Node.js (ExpressJS, REST APIs, Socket.io)
├── frontend-web/       # Ứng dụng web ReactJS (Admin/Operator Dashboard)
├── mobile-app/         # Ứng dụng di động Flutter (Customer)
├── iot-firmware/       # Mã nguồn ESP32 (Arduino C++/ESP-IDF, MQTT Client)
├── docs/               # Tài liệu thiết kế hệ thống, SRS, UML, sơ đồ mạch
└── README.md