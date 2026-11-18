/**
 * OpenAPI / Swagger spec for Mushroom IoT API v2.0.0
 */
export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mushroom IoT API",
    version: "2.0.0",
    description: `REST API cho hệ thống quản lý nuôi trồng nấm thông minh.

**Luồng nghiệp vụ trung tâm:**
Customer đăng ký → gửi yêu cầu thuê → Operator/Admin duyệt & gán khay →
Customer nhập mã liên kết → ESP32 gửi số liệu → Hệ thống hiển thị/cảnh báo →
Operator/Admin điều khiển, cập nhật tiến độ và thu hoạch.

**Phân quyền:**
- \`ADMIN\` kế thừa quyền của \`OPERATOR\`
- \`CUSTOMER\` chỉ thấy dữ liệu thuộc quyền của mình
`,
    contact: { name: "Mushroom IoT Team" },
  },
  servers: [
    { url: "http://localhost:5000", description: "Local development" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token (8 hours). Obtain via POST /api/auth/login",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          details: { type: "object" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          full_name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "OPERATOR", "CUSTOMER"] },
          status: { type: "string", enum: ["ACTIVE", "EMAIL_UNVERIFIED", "DISABLED", "LOCKED"] },
          is_active: { type: "boolean" },
          email_verified: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          location: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "MAINTENANCE", "INACTIVE"] },
          total_trays: { type: "integer" },
          rented_trays: { type: "integer" },
          total_devices: { type: "integer" },
        },
      },
      Tray: {
        type: "object",
        properties: {
          id: { type: "integer" },
          code: { type: "string" },
          room_id: { type: "integer" },
          room_name: { type: "string" },
          status: { type: "string", enum: ["AVAILABLE", "ASSIGNED", "RENTED", "MAINTENANCE"] },
          growth_stage: {
            type: "string",
            enum: ["PREPARATION", "INCUBATION", "FRUITING", "READY_TO_HARVEST", "HARVESTED", "COMPLETED"],
          },
          mushroom_variety: { type: "string" },
        },
      },
      Rental: {
        type: "object",
        properties: {
          id: { type: "integer" },
          customer_id: { type: "integer" },
          package_id: { type: "integer" },
          quantity: { type: "integer", minimum: 1, maximum: 5 },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "ASSIGNED", "ACTIVE", "COMPLETED", "CANCELLED"],
          },
          start_date: { type: "string", format: "date" },
          end_date: { type: "string", format: "date" },
          trays: { type: "array", items: { $ref: "#/components/schemas/Tray" } },
          active_link_code: { type: "string", description: "Single-use link code valid 24h" },
        },
      },
      SensorReading: {
        type: "object",
        properties: {
          id: { type: "integer" },
          room_id: { type: "integer" },
          sensor_type: { type: "string", enum: ["TEMPERATURE", "HUMIDITY", "CO2"] },
          value: { type: "number" },
          unit: { type: "string" },
          message_id: { type: "string", description: "Unique message ID for deduplication" },
          recorded_at: { type: "string", format: "date-time" },
        },
      },
      Device: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          device_type: { type: "string" },
          room_id: { type: "integer" },
          is_on: { type: "boolean" },
          status: { type: "string", enum: ["ONLINE", "OFFLINE", "ERROR"] },
          last_seen_at: { type: "string", format: "date-time" },
        },
      },
      Alert: {
        type: "object",
        properties: {
          id: { type: "integer" },
          room_id: { type: "integer" },
          metric: { type: "string", enum: ["TEMPERATURE", "HUMIDITY", "CO2"] },
          severity: { type: "string", enum: ["INFO", "WARNING", "DANGER"] },
          title: { type: "string" },
          message: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "RESOLVED"] },
          is_read: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Harvest: {
        type: "object",
        properties: {
          id: { type: "integer" },
          tray_id: { type: "integer" },
          quantity_kg: { type: "number" },
          quality_grade: { type: "string", default: "STANDARD" },
          planned_date: { type: "string", format: "date" },
          harvest_date: { type: "string", format: "date" },
          status: { type: "string", enum: ["PLANNED", "COMPLETED", "CANCELLED"] },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản mới",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["full_name", "email", "password"],
                properties: {
                  full_name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Đăng ký thành công" },
          400: { description: "Dữ liệu không hợp lệ" },
          409: { description: "Email đã tồn tại" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Đăng nhập thành công — trả JWT token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    refreshToken: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Sai email hoặc mật khẩu" },
          423: { description: "Tài khoản tạm thời bị khóa" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Lấy thông tin tài khoản hiện tại",
        responses: {
          200: { description: "Thông tin người dùng", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Chưa xác thực" },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users (Admin)"],
        summary: "Danh sách người dùng (Admin)",
        parameters: [
          { name: "role", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: { 200: { description: "Danh sách người dùng" }, 403: { description: "Không đủ quyền" } },
      },
    },
    "/api/rooms": {
      get: { tags: ["Rooms"], summary: "Danh sách phòng trồng", responses: { 200: { description: "OK" } } },
      post: { tags: ["Rooms"], summary: "Tạo phòng trồng mới", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, location: { type: "string" }, status: { type: "string" } } } } } }, responses: { 201: { description: "Tạo thành công" } } },
    },
    "/api/packages": {
      get: { tags: ["Rental Packages"], summary: "Danh sách gói thuê (công khai khi là khách)", security: [], responses: { 200: { description: "OK" } } },
    },
    "/api/rentals": {
      get: { tags: ["Rentals"], summary: "Danh sách yêu cầu thuê", responses: { 200: { description: "OK" } } },
      post: { tags: ["Rentals"], summary: "Gửi yêu cầu thuê (Customer)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["package_id"], properties: { package_id: { type: "integer" }, quantity: { type: "integer", minimum: 1, maximum: 5 }, notes: { type: "string" } } } } } }, responses: { 201: { description: "Yêu cầu tạo thành công" } } },
    },
    "/api/rentals/{id}/approve": {
      post: { tags: ["Rentals"], summary: "Duyệt yêu cầu thuê (Operator/Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Đã duyệt" }, 400: { description: "Trạng thái không hợp lệ" } } },
    },
    "/api/rentals/{id}/reject": {
      post: { tags: ["Rentals"], summary: "Từ chối yêu cầu thuê", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], responses: { 200: { description: "Đã từ chối" } } },
    },
    "/api/rentals/{id}/assign-trays": {
      post: { tags: ["Rentals"], summary: "Gán khay và cấp mã liên kết (Operator/Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["tray_ids"], properties: { tray_ids: { type: "array", items: { type: "integer" }, minItems: 1 } } } } } }, responses: { 200: { description: "Gán thành công + trả link_code" } } },
    },
    "/api/rentals/link": {
      post: { tags: ["Rentals"], summary: "Liên kết khay bằng mã (Customer)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code"], properties: { code: { type: "string" } } } } } }, responses: { 200: { description: "Liên kết thành công, hợp đồng ACTIVE" }, 400: { description: "Mã sai, hết hạn hoặc đã dùng" } } },
    },
    "/api/sensors": {
      post: { tags: ["Sensors"], summary: "Nhập số liệu cảm biến (IoT/Operator/Admin)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["sensor_type", "value"], properties: { room_id: { type: "integer" }, sensor_type: { type: "string", enum: ["TEMPERATURE", "HUMIDITY", "CO2"] }, value: { type: "number" }, unit: { type: "string" }, message_id: { type: "string" } } } } } }, responses: { 201: { description: "Lưu thành công" }, 200: { description: "Trùng message_id — bỏ qua" } } },
    },
    "/api/sensors/latest": {
      get: { tags: ["Sensors"], summary: "Giá trị cảm biến mới nhất", parameters: [{ name: "room_id", in: "query", schema: { type: "integer" } }], responses: { 200: { description: "OK" } } },
    },
    "/api/sensors/history": {
      get: { tags: ["Sensors"], summary: "Lịch sử số đo", parameters: [{ name: "room_id", in: "query", schema: { type: "integer" } }, { name: "sensor_type", in: "query", schema: { type: "string" } }, { name: "from", in: "query", schema: { type: "string", format: "date-time" } }, { name: "to", in: "query", schema: { type: "string", format: "date-time" } }, { name: "limit", in: "query", schema: { type: "integer", default: 200 } }], responses: { 200: { description: "OK" } } },
    },
    "/api/devices/{id}/command": {
      post: { tags: ["Devices"], summary: "Gửi lệnh điều khiển + chờ ACK 10s (Operator/Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["action"], properties: { action: { type: "string", enum: ["TURN_ON", "TURN_OFF", "TOGGLE", "SET_SPEED", "CONFIG"] }, payload: { type: "object" } } } } } }, responses: { 200: { description: "ACKED — thiết bị xác nhận" }, 504: { description: "TIMEOUT — không có ACK trong 10 giây" } } },
    },
    "/api/alerts": {
      get: { tags: ["Alerts"], summary: "Danh sách cảnh báo môi trường", responses: { 200: { description: "OK" } } },
    },
    "/api/alerts/thresholds": {
      get: { tags: ["Alerts"], summary: "Danh sách ngưỡng cảm biến", responses: { 200: { description: "OK" } } },
    },
    "/api/alerts/thresholds/{metric}": {
      put: { tags: ["Alerts"], summary: "Cập nhật ngưỡng (Operator/Admin)", parameters: [{ name: "metric", in: "path", required: true, schema: { type: "string", enum: ["TEMPERATURE", "HUMIDITY", "CO2"] } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["lower_bound", "upper_bound"], properties: { lower_bound: { type: "number" }, upper_bound: { type: "number" }, unit: { type: "string" } } } } } }, responses: { 200: { description: "OK" } } },
    },
    "/api/harvests": {
      get: { tags: ["Harvests"], summary: "Danh sách thu hoạch", responses: { 200: { description: "OK" } } },
      post: { tags: ["Harvests"], summary: "Lập kế hoạch thu hoạch (Operator/Admin)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["tray_id"], properties: { tray_id: { type: "integer" }, planned_date: { type: "string", format: "date" }, notes: { type: "string" } } } } } }, responses: { 201: { description: "OK" } } },
    },
    "/api/harvests/{id}/record": {
      put: { tags: ["Harvests"], summary: "Ghi nhận kết quả thu hoạch (Operator/Admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["quantity_kg"], properties: { quantity_kg: { type: "number" }, quality_grade: { type: "string", default: "STANDARD" }, harvest_date: { type: "string", format: "date" }, notes: { type: "string" } } } } } }, responses: { 200: { description: "Thu hoạch ghi nhận, tray chuyển HARVESTED" } } },
    },
    "/api/dashboard/summary": {
      get: { tags: ["Dashboard"], summary: "Thống kê tổng quan trang trại", responses: { 200: { description: "OK" } } },
    },
  },
};
