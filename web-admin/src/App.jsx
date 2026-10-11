import React, { useEffect, useState, useMemo } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bell, Camera, Check, CheckCircle2, ChevronRight,
  CircleGauge, Clock, Cloud, Copy, Download, Droplet, Eye, FileDown, Flame, HelpCircle,
  Info, KeyRound, Layers, LayoutGrid, Leaf, Lightbulb, Lock, LogOut, Menu, MonitorPlay,
  MoreHorizontal, Package, Play, Plus, Power, Radio, Receipt, RefreshCw, Search,
  Settings, ShieldCheck, Sparkles, Sprout, Table, Thermometer, Trash2, User, UserCheck,
  Users, Video, Wind, X, Zap
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import * as api from "./services/api";

// Fallback image map for mushroom varieties (high quality Unsplash images)
const MUSHROOM_IMAGES = {
  "Nấm Bào Ngư Xám": "https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=600&q=80",
  "Nấm Bào Ngư Trắng": "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=600&q=80",
  "Nấm Linh Chi": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
  "Nấm Hoàng Kim": "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=600&q=80",
  default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
};

const FARM_ROOM_IMAGE = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80";

const fallbackChartData = [
  { time: "02:00", humidity: 88, temp: 24.2, co2: 620 },
  { time: "06:00", humidity: 93, temp: 24.5, co2: 640 },
  { time: "10:00", humidity: 89, temp: 26.8, co2: 690 },
  { time: "14:00", humidity: 86, temp: 27.4, co2: 730 },
  { time: "18:00", humidity: 91, temp: 25.8, co2: 660 },
  { time: "22:00", humidity: 92, temp: 24.9, co2: 630 }
];

// Navigation menu definition grouped by business domain
const MENU_SECTIONS = [
  {
    title: "TỔNG QUAN",
    items: [
      { id: "dashboard", label: "Dashboard Farm", icon: CircleGauge, need: null },
      { id: "reports", label: "Báo cáo & Thống kê", icon: FileDown, need: "staff" }
    ]
  },
  {
    title: "NUÔI TRỒNG",
    items: [
      { id: "trays", label: "Khay nuôi trồng", icon: Leaf, need: null },
      { id: "rooms", label: "Phòng nuôi trồng", icon: Layers, need: "staff" },
      { id: "packages", label: "Gói thuê nấm", icon: Package, need: "ADMIN" },
      { id: "rentals", label: "Hợp đồng thuê", icon: Receipt, need: "staff" },
      { id: "harvests", label: "Thu hoạch & Giao hàng", icon: Sprout, need: null }
    ]
  },
  {
    title: "GIÁM SÁT IOT",
    items: [
      { id: "sensors", label: "Dữ liệu cảm biến", icon: Activity, need: null },
      { id: "devices", label: "Thiết bị & Relay", icon: Power, need: "staff" },
      { id: "camera", label: "Camera & Thư viện", icon: Video, need: null }
    ]
  },
  {
    title: "HỆ THỐNG",
    items: [
      { id: "users", label: "Tài khoản & Quyền", icon: Users, need: "ADMIN" },
      { id: "notifications", label: "Thông báo", icon: Bell, need: null },
      { id: "settings", label: "Cài đặt vi khí hậu", icon: Settings, need: "staff" }
    ]
  }
];

function canSee(need, role) {
  if (!need) return true;
  if (need === "ADMIN") return role === "ADMIN";
  if (need === "staff") return role === "ADMIN" || role === "FARM_OPERATOR";
  return true;
}

// ==========================================================================
// COMMON UI COMPONENTS
// ==========================================================================

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = "Xác nhận xóa", isDanger = true }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: 440 }}>
        <div className="modal-header" style={{ borderBottomColor: isDanger ? "rgba(239, 68, 68, 0.3)" : undefined }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: 10, color: isDanger ? "#f87171" : "#fff" }}>
            <AlertTriangle size={20} /> {title}
          </h3>
          <button className="btn-icon" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Hủy bỏ</button>
          <button className={isDanger ? "btn btn-danger-solid" : "btn btn-primary"} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordResetModal({ open, user, onClose, onReset }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (!open || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    onReset(user.id, password);
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <KeyRound size={18} color="var(--emerald-400)" /> Đặt lại mật khẩu
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: 13.5 }}>
              Thiết lập mật khẩu mới cho tài khoản: <b>{user.full_name}</b> ({user.email})
            </p>
            {error && <div className="toast-item error" style={{ marginBottom: 14 }}>{error}</div>}
            <div className="form-group">
              <label>Mật khẩu mới (tối thiểu 8 ký tự)</label>
              <input
                type="password"
                required
                minLength={8}
                autoFocus
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary">Lưu mật khẩu mới</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  let cls = "status-pill";
  let label = status;

  if (s === "AVAILABLE" || s === "ACTIVE" || s === "ONLINE" || s === "COMPLETED") {
    cls += " available";
    label = s === "AVAILABLE" ? "Còn trống" : s === "ACTIVE" ? "Đang thuê" : s === "ONLINE" ? "Online" : "Hoàn thành";
  } else if (s === "RENTED" || s === "GROWING") {
    cls += " growing";
    label = s === "RENTED" ? "Đã gán" : "Đang phát triển";
  } else if (s === "HARVEST_READY" || s === "PLANNED" || s === "REQUESTED") {
    cls += " harvest_ready";
    label = s === "HARVEST_READY" ? "Sẵn sàng thu hoạch" : s === "REQUESTED" ? "Đã yêu cầu" : "Dự kiến";
  } else {
    cls += " offline";
    label = s === "OFFLINE" ? "Offline" : s === "CANCELLED" ? "Đã hủy" : status;
  }

  return <span className={cls}>{label}</span>;
}

function EmptyState({ icon: Icon = Sprout, title = "Chưa có dữ liệu", desc, action }) {
  return (
    <div className="empty-state-box">
      <div className="empty-icon-wrap"><Icon size={28} /></div>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ==========================================================================
// LOGIN & REGISTRATION SCREEN (SAAS SPLIT-SCREEN)
// ==========================================================================

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setNotice("");
    try {
      if (mode === "register") {
        if (password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự.");
        await api.register(fullName, email, password, phone);
        setMode("login");
        setPassword("");
        setNotice("Đăng ký thành công! Hãy đăng nhập bằng email vừa tạo.");
      } else {
        const r = await api.login(email, password);
        localStorage.setItem("token", r.token);
        localStorage.setItem("user", JSON.stringify(r.user));
        onLogin(r.user);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrap">
      <div className="login-hero-side">
        <div className="brand" style={{ padding: 0 }}>
          <div className="logo"><Sprout size={24} /></div>
          <div className="brand-info">
            <b>MUSHROOM IOT <span className="brand-badge">SaaS</span></b>
            <span>Smart Mushroom Farm Management</span>
          </div>
        </div>

        <div className="login-hero-quote">
          <h2>Nuôi trồng nấm thông minh kết hợp IoT thời gian thực</h2>
          <p>
            Giám sát vi khí hậu, điều khiển phun sương tự động, tối ưu hóa chu kỳ sinh trưởng
            và kết nối người tiêu dùng với nông trại công nghệ cao.
          </p>
        </div>

        <div style={{ display: "flex", gap: 20, color: "var(--emerald-300)", fontSize: 13 }}>
          <span>● Cảm biến DHT22 & CO₂</span>
          <span>● Camera Live Stream</span>
          <span>● Điều hòa Relay tự động</span>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-header-box">
            <div className="logo" style={{ margin: "0 auto 14px", width: 48, height: 48 }}>
              <Sprout size={26} />
            </div>
            <h2>{mode === "login" ? "Đăng nhập hệ thống" : "Tạo tài khoản thành viên"}</h2>
            <p>{mode === "login" ? "Chào mừng bạn quay trở lại với Mushroom Farm" : "Tham gia trải nghiệm thuê khay nấm trực tuyến"}</p>
          </div>

          {err && <div className="toast-item error" style={{ marginBottom: 16 }}>{err}</div>}
          {notice && <div className="toast-item success" style={{ marginBottom: 16 }}>{notice}</div>}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  required
                  className="form-control"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@mushroom.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label>Số điện thoại (tùy chọn)</label>
                <input
                  className="form-control"
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                required
                minLength={8}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: 12, marginTop: 8 }} disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setNotice(""); }}
            >
              {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Quay lại đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// MAIN APPLICATION SHELL
// ==========================================================================

export function App() {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3800);
  };

  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      notify("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    notify("Đã đăng xuất khỏi hệ thống.");
  };

  if (!user) {
    return <LoginScreen onLogin={(u) => { setUser(u); notify(`Xin chào ${u.fullName}!`); }} />;
  }

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className={sidebarOpen ? "side" : "side col"}>
        <div className="brand">
          <div className="logo"><Sprout size={22} /></div>
          {sidebarOpen && (
            <div className="brand-info">
              <b>MUSHROOM <span className="brand-badge">PRO</span></b>
              <span>IoT Smart Farm</span>
            </div>
          )}
        </div>

        <nav>
          {MENU_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => canSee(item.need, user.role));
            if (!visibleItems.length) return null;
            return (
              <React.Fragment key={section.title}>
                {sidebarOpen && <div className="nav-section-title">{section.title}</div>}
                {visibleItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={page === id ? "nav active" : "nav"}
                    onClick={() => setPage(id)}
                    title={!sidebarOpen ? label : undefined}
                  >
                    <Icon size={18} />
                    {sidebarOpen && <span>{label}</span>}
                  </button>
                ))}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="user-mini-card">
          <div className="avatar-pill">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          {sidebarOpen && (
            <div className="user-mini-info">
              <span className="user-mini-name">{user.fullName}</span>
              <span className="user-mini-role">{user.role}</span>
            </div>
          )}
          <button className="logout" onClick={handleLogout} title="Đăng xuất">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main>
        <header>
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={18} />
          </button>

          <div className="header-title-box">
            <h1>Nhà Trồng Nấm Thông Minh 2026</h1>
            <p>
              <span>Trang trại: Khu A · Phòng 01</span>
              <span>•</span>
              <span style={{ color: "var(--emerald-400)" }}>{user.fullName} ({user.role})</span>
            </p>
          </div>

          <div className="header-actions">
            <div className="live-indicator-pill">
              <span className="live-dot" />
              <span>IoT Gateway: Live</span>
            </div>

            <button className="btn btn-secondary" onClick={() => setRefreshTrigger((x) => x + 1)}>
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>
        </header>

        {/* Toast Notification Container */}
        {toast && (
          <div className="toast-container">
            <div className={`toast-item ${toast.type}`}>
              {toast.type === "success" ? <CheckCircle2 size={18} color="var(--emerald-400)" /> : <AlertTriangle size={18} color="#f87171" />}
              <span>{toast.text}</span>
            </div>
          </div>
        )}

        {/* Active Page View Component */}
        <PageComponent
          page={page}
          refresh={refreshTrigger}
          notify={notify}
          user={user}
          onNavigate={(targetPage) => setPage(targetPage)}
        />
      </main>
    </div>
  );
}

function PageComponent({ page, refresh, notify, user, onNavigate }) {
  switch (page) {
    case "dashboard": return <DashboardView refresh={refresh} notify={notify} user={user} onNavigate={onNavigate} />;
    case "trays": return <TraysView notify={notify} user={user} />;
    case "rooms": return <RoomsView notify={notify} />;
    case "packages": return <PackagesView notify={notify} user={user} />;
    case "rentals": return <RentalsView notify={notify} user={user} />;
    case "sensors": return <SensorsView notify={notify} />;
    case "devices": return <DevicesView notify={notify} />;
    case "camera": return <CameraPageView notify={notify} user={user} />;
    case "notifications": return <NotificationsView notify={notify} />;
    case "users": return <UsersView notify={notify} user={user} />;
    case "harvests": return <HarvestsView notify={notify} user={user} />;
    case "reports": return <ReportsView notify={notify} user={user} />;
    case "settings": return <SettingsPageView notify={notify} user={user} />;
    default: return <DashboardView refresh={refresh} notify={notify} user={user} onNavigate={onNavigate} />;
  }
}

// ==========================================================================
// 1. DASHBOARD VIEW
// ==========================================================================

function DashboardView({ refresh, notify, user, onNavigate }) {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState(fallbackChartData);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const [dashData, historyData] = await Promise.all([
          api.dashboard().catch(() => null),
          api.sensorHistory().catch(() => [])
        ]);

        if (!isMounted) return;
        if (dashData) setData(dashData);

        // Fetch devices for staff to toggle
        try {
          const devList = await api.devices();
          if (isMounted) setDevices(devList || []);
        } catch {
          if (isMounted) setDevices([]);
        }

        // Format history for Recharts
        if (Array.isArray(historyData) && historyData.length) {
          const grouped = {};
          historyData.forEach((item) => {
            const timeLabel = new Date(item.recorded_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            grouped[timeLabel] ??= { time: timeLabel };
            if (item.sensor_type === "HUMIDITY") grouped[timeLabel].humidity = Number(item.value);
            if (item.sensor_type === "TEMPERATURE") grouped[timeLabel].temp = Number(item.value);
            if (item.sensor_type === "CO2") grouped[timeLabel].co2 = Number(item.value);
          });
          const chartArray = Object.values(grouped).slice(-24);
          if (chartArray.length >= 2) setChart(chartArray);
        }
      } catch (e) {
        notify(e.message, "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [refresh]);

  const toggleDevice = async (d) => {
    try {
      const nextState = !d.is_on;
      const res = await api.toggleDevice(d.id, { isOn: nextState });
      setDevices((prev) => prev.map((x) => x.id === d.id ? res : x));
      notify(`Đã ${nextState ? "BẬT" : "TẮT"} thiết bị: ${d.name}`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  // Safe reading values (avoid NaN and false 0)
  const currentReadings = data?.current || {};
  const tempVal = currentReadings.temperature != null ? Number(currentReadings.temperature).toFixed(1) : "25.8";
  const humVal = currentReadings.humidity != null ? Number(currentReadings.humidity).toFixed(1) : "89.2";
  const co2Val = currentReadings.co2 != null ? Math.round(Number(currentReadings.co2)) : "640";
  const onlineDevCount = data?.counts?.onlineDevices ?? devices.filter((d) => d.status === "ONLINE" || d.is_on).length ?? 4;

  const featured = data?.featured;
  const mushroomImg = (featured && MUSHROOM_IMAGES[featured.mushroom_type]) || MUSHROOM_IMAGES.default;

  return (
    <>
      {/* Hero Welcome Banner */}
      <section className="hero-banner">
        <div className="hero-text">
          <h2>Xin chào, {user.fullName}!</h2>
          <p>
            Hệ thống điều hòa vi khí hậu đang vận hành tự động. Các chỉ số nhiệt độ, độ ẩm và thông gió
            đều nằm trong ngưỡng sinh trưởng tối ưu cho nấm bào ngư.
          </p>
        </div>
        <div className="hero-badges">
          <div className="hero-stat-chip">
            <span>Trạng thái Farm</span>
            <b style={{ color: "var(--emerald-400)" }}>Hoạt động tốt</b>
          </div>
          <div className="hero-stat-chip">
            <span>Phòng nuôi trồng</span>
            <b>{data?.counts?.rooms ?? 1} Khu vực</b>
          </div>
        </div>
      </section>

      {/* KPI Metric Cards */}
      <section className="kpi-grid">
        <div className="kpi-card temp">
          <div className="kpi-header">
            <span className="kpi-title">Nhiệt độ phòng</span>
            <div className="kpi-icon-wrap"><Thermometer size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{tempVal}</span>
            <span className="kpi-unit">°C</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-range">Ngưỡng chuẩn: 24 – 28 °C</span>
            <span className="kpi-badge optimal">Tối ưu</span>
          </div>
        </div>

        <div className="kpi-card hum">
          <div className="kpi-header">
            <span className="kpi-title">Độ ẩm không khí</span>
            <div className="kpi-icon-wrap"><Cloud size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{humVal}</span>
            <span className="kpi-unit">%</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-range">Ngưỡng chuẩn: 85 – 95 %</span>
            <span className="kpi-badge optimal">Lý tưởng</span>
          </div>
        </div>

        <div className="kpi-card co2">
          <div className="kpi-header">
            <span className="kpi-title">Nồng độ khí CO₂</span>
            <div className="kpi-icon-wrap"><Wind size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{co2Val}</span>
            <span className="kpi-unit">ppm</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-range">Mức tối đa: &lt; 800 ppm</span>
            <span className="kpi-badge optimal">Thông thoáng</span>
          </div>
        </div>

        <div className="kpi-card devices">
          <div className="kpi-header">
            <span className="kpi-title">Thiết bị IoT kết nối</span>
            <div className="kpi-icon-wrap"><Power size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{onlineDevCount}</span>
            <span className="kpi-unit">thiết bị</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-range">Relay quạt, phun sương</span>
            <span className="kpi-badge optimal">Sẵn sàng</span>
          </div>
        </div>
      </section>

      {/* Featured Tray Showcase */}
      {featured && (
        <section className="featured-tray-card">
          <div className="featured-tray-img-wrap">
            <img src={mushroomImg} alt={featured.mushroom_type} />
            <span className="featured-tray-badge">Khay nổi bật</span>
          </div>
          <div className="featured-tray-body">
            <div className="featured-tray-top">
              <span className="featured-tray-code">{featured.code}</span>
              <StatusBadge status={featured.status} />
            </div>
            <div className="featured-tray-type">
              {featured.mushroom_type} · {featured.room_name || "Phòng trồng 01"} {featured.rack ? `(${featured.rack})` : ""}
            </div>
            <div className="progress-track-wrap">
              <div className="progress-label-row">
                <span>Giai đoạn: <b>{featured.stage || "Ra quả thể"}</b></span>
                <span>Chu kỳ: Ngày {featured.growth_day || 14} / 30</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.max(10, ((featured.growth_day || 14) / 30) * 100))}%` }} />
              </div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => onNavigate("trays")}>
            Xem tất cả khay <ChevronRight size={16} />
          </button>
        </section>
      )}

      {/* 2-Column Grid: Recharts Environment & Camera/Actuators */}
      <section className="dash-main-grid">
        {/* Environmental Recharts Line Chart */}
        <div className="dash-panel">
          <div className="panel-head">
            <h3><Activity size={18} color="var(--emerald-400)" /> Biểu đồ vi khí hậu theo thời gian</h3>
            <span>Cập nhật liên tục từ cảm biến</span>
          </div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="humGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis yAxisId="hum" domain={[60, 100]} stroke="#0ea5e9" fontSize={11} tickLine={false} />
                <YAxis yAxisId="temp" orientation="right" domain={[18, 36]} stroke="#f43f5e" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0e1a2d", borderColor: "rgba(255,255,255,0.15)", borderRadius: 10, color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Area yAxisId="hum" type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#humGradient)" />
                <Area yAxisId="temp" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera Live Stream & Actuator Switches */}
        <div className="dash-panel">
          <div className="panel-head">
            <h3><Camera size={18} color="var(--emerald-400)" /> Camera trực tuyến</h3>
            <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => onNavigate("camera")}>
              Chi tiết
            </button>
          </div>

          <div className="camera-showcase">
            <img src={FARM_ROOM_IMAGE} alt="Live Mushroom Camera" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div className="camera-overlay-badge">
              <span className="badge-live-stream"><Radio size={12} /> LIVE</span>
              <span className="badge-type-label">Phòng 01 · TRAY-A101</span>
            </div>
            <button className="camera-play-overlay-btn" onClick={() => onNavigate("camera")} title="Xem toàn màn hình">
              <Play size={22} fill="#fff" />
            </button>
            <div className="camera-meta-bottom">
              <span>Sensor Overlay: 25.8°C / 89.2%</span>
              <span style={{ fontSize: 11, color: "var(--emerald-400)" }}>30 FPS · HD</span>
            </div>
          </div>

          <div className="panel-head" style={{ marginTop: 22, marginBottom: 12 }}>
            <h3><Power size={18} color="var(--emerald-400)" /> Điều khiển vi khí hậu</h3>
            <span>{devices.length} Thiết bị</span>
          </div>

          <div className="actuator-list">
            {devices.slice(0, 4).map((d) => (
              <div className="actuator-item" key={d.id}>
                <div className="actuator-info">
                  <div className="actuator-icon-box">
                    {d.device_type === "MIST" ? <Droplet size={18} /> : d.device_type === "FAN" ? <Wind size={18} /> : d.device_type === "LED" ? <Lightbulb size={18} /> : <Power size={18} />}
                  </div>
                  <div>
                    <div className="actuator-name">{d.name}</div>
                    <div className="actuator-sub">{d.device_code} · {d.device_type}</div>
                  </div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={!!d.is_on}
                    disabled={user.role === "CUSTOMER"}
                    onChange={() => toggleDevice(d)}
                  />
                  <span className="slider" />
                </label>
              </div>
            ))}
            {!devices.length && <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 14 }}>Chưa có thiết bị điều khiển nào.</div>}
          </div>
        </div>
      </section>
    </>
  );
}

// ==========================================================================
// 2. TRAYS VIEW (KHAY NUÔI TRỒNG)
// ==========================================================================

function TraysView({ notify, user }) {
  const [data, setData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [createOpen, setCreateOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const staff = user.role !== "CUSTOMER";

  const loadData = async () => {
    try {
      const trays = await api.trays();
      setData(trays || []);
      if (staff) {
        const roomList = await api.rooms();
        setRooms(roomList || []);
      }
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredTrays = useMemo(() => {
    return data.filter((t) => {
      const matchSearch = (t.code || "").toLowerCase().includes(search.toLowerCase()) ||
                          (t.mushroom_type || "").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || t.status === filterType;
      return matchSearch && matchType;
    });
  }, [data, search, filterType]);

  const handleSaveTray = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createTray({
        code: f.get("code"),
        mushroomType: f.get("mushroomType"),
        roomId: f.get("roomId") || null,
        rack: f.get("rack") || null,
        status: f.get("status") || "AVAILABLE",
        growthDay: Number(f.get("growthDay") || 0),
        expectedHarvestDate: f.get("expectedHarvestDate") || null
      });
      setCreateOpen(false);
      loadData();
      notify("Đã thêm khay nuôi trồng mới thành công!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleSaveProgress = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createProgress({
        trayId: progressOpen.id,
        stage: f.get("stage"),
        progressPercent: Number(f.get("progressPercent") || 0),
        note: f.get("note")
      });
      setProgressOpen(null);
      loadData();
      notify(`Đã cập nhật tiến độ cho khay ${progressOpen.code}!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteTray(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
      notify(`Đã xóa khay ${deleteTarget.code}!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div className="search-filter-box">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo mã khay hoặc giống nấm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="AVAILABLE">Còn trống</option>
            <option value="RENTED">Đã thuê / Đang gán</option>
            <option value="GROWING">Đang phát triển</option>
            <option value="HARVEST_READY">Sẵn sàng thu hoạch</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-md)", padding: 2 }}>
            <button className={`btn-icon ${viewMode === "grid" ? "active" : ""}`} style={{ border: 0 }} onClick={() => setViewMode("grid")}>
              <LayoutGrid size={16} />
            </button>
            <button className={`btn-icon ${viewMode === "table" ? "active" : ""}`} style={{ border: 0 }} onClick={() => setViewMode("table")}>
              <Table size={16} />
            </button>
          </div>

          {staff && (
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> Thêm khay mới
            </button>
          )}
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="trays-grid">
          {filteredTrays.map((t) => {
            const img = MUSHROOM_IMAGES[t.mushroom_type] || MUSHROOM_IMAGES.default;
            return (
              <div className="tray-card" key={t.id}>
                <div className="tray-card-media">
                  <img src={img} alt={t.mushroom_type} />
                  <div className="tray-card-badge-top">
                    <StatusBadge status={t.status} />
                  </div>
                </div>

                <div className="tray-card-body">
                  <div className="tray-card-title-row">
                    <span className="tray-card-code">{t.code}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.rack || "Kệ chưa gán"}</span>
                  </div>
                  <div className="tray-card-mushroom">{t.mushroom_type}</div>

                  <div className="tray-meta-grid">
                    <div>
                      <span>Phòng trồng</span>
                      <b>{t.room_name || "Phòng 01"}</b>
                    </div>
                    <div>
                      <span>Khách hàng</span>
                      <b>{t.customer_name || "Chưa có"}</b>
                    </div>
                    <div>
                      <span>Chu kỳ sinh trưởng</span>
                      <b>Ngày {t.growth_day} / 30</b>
                    </div>
                    <div>
                      <span>Giai đoạn</span>
                      <b>{t.latest_stage || "Mới cấy"}</b>
                    </div>
                  </div>

                  <div className="tray-card-actions">
                    {staff && (
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setProgressOpen(t)}>
                        <Sparkles size={14} /> Cập nhật tiến độ
                      </button>
                    )}
                    {staff && (
                      <button className="btn-icon" style={{ color: "#f87171" }} onClick={() => setDeleteTarget(t)} title="Xóa khay">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!filteredTrays.length && (
            <div style={{ gridColumn: "1/-1" }}>
              <EmptyState title="Không tìm thấy khay nuôi trồng phù hợp" desc="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái." />
            </div>
          )}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mã khay</th>
                  <th>Giống nấm</th>
                  <th>Phòng trồng</th>
                  <th>Kệ</th>
                  <th>Khách hàng</th>
                  <th>Trạng thái</th>
                  <th>Giai đoạn</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrays.map((t) => (
                  <tr key={t.id}>
                    <td><b>{t.code}</b></td>
                    <td><span style={{ color: "var(--emerald-400)", fontWeight: 600 }}>{t.mushroom_type}</span></td>
                    <td>{t.room_name || "—"}</td>
                    <td>{t.rack || "—"}</td>
                    <td>{t.customer_name || "Chưa gán"}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.latest_stage || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {staff && (
                          <button className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => setProgressOpen(t)}>
                            Tiến độ
                          </button>
                        )}
                        {staff && (
                          <button className="btn-icon" style={{ width: 32, height: 32, color: "#f87171" }} onClick={() => setDeleteTarget(t)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Tray */}
      {createOpen && (
        <Modal title="Thêm khay nuôi trồng mới" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleSaveTray}>
            <div className="form-group">
              <label>Mã định danh khay</label>
              <input required name="code" className="form-control" placeholder="TRAY-A103" />
            </div>
            <div className="form-group">
              <label>Giống nấm nuôi cấy</label>
              <input required name="mushroomType" className="form-control" placeholder="Nấm Bào Ngư Xám" />
            </div>
            <div className="form-group">
              <label>Phòng nuôi trồng</label>
              <select name="roomId" className="form-control">
                <option value="">Chưa gán phòng</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Vị trí kệ</label>
              <input name="rack" className="form-control" placeholder="Kệ 01 · Tầng 2" />
            </div>
            <div className="form-group">
              <label>Trạng thái khởi tạo</label>
              <select name="status" className="form-control">
                <option value="AVAILABLE">Còn trống (AVAILABLE)</option>
                <option value="RENTED">Đã thuê (RENTED)</option>
                <option value="GROWING">Đang phát triển (GROWING)</option>
              </select>
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu khay</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Update Progress */}
      {progressOpen && (
        <Modal title={`Cập nhật tiến độ · ${progressOpen.code}`} onClose={() => setProgressOpen(null)}>
          <form onSubmit={handleSaveProgress}>
            <div className="form-group">
              <label>Giai đoạn sinh trưởng</label>
              <input required name="stage" className="form-control" placeholder="Ra quả thể / Phát triển mũ nấm" defaultValue={progressOpen.latest_stage || "Ra quả thể"} />
            </div>
            <div className="form-group">
              <label>Tiến độ (%)</label>
              <input type="number" min="0" max="100" name="progressPercent" className="form-control" defaultValue={progressOpen.progress_percent || 50} />
            </div>
            <div className="form-group">
              <label>Ghi chú quan sát vi khí hậu & tơ nấm</label>
              <textarea name="note" className="form-control" placeholder="Tơ nấm ăn trắng đều, chuẩn bị thông gió kích thích quả thể..." rows={3} />
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setProgressOpen(null)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu tiến độ</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa khay nuôi trồng"
        message={`Bạn có chắc chắn muốn xóa khay ${deleteTarget?.code}? Thao tác này sẽ xóa các bản ghi liên quan nếu chưa có hợp đồng ràng buộc.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ==========================================================================
// 3. ROOMS VIEW (PHÒNG TRỒNG)
// ==========================================================================

function RoomsView({ notify }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.rooms();
      setData(res || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      if (editTarget) {
        await api.updateRoom(editTarget.id, {
          name: f.get("name"),
          code: f.get("code"),
          location: f.get("location"),
          status: f.get("status")
        });
        notify("Đã cập nhật thông tin phòng trồng!");
      } else {
        await api.createRoom({
          name: f.get("name"),
          code: f.get("code"),
          location: f.get("location"),
          status: f.get("status") || "ACTIVE"
        });
        notify("Đã thêm phòng nuôi trồng mới!");
      }
      setOpen(false);
      setEditTarget(null);
      loadData();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteRoom(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
      notify(`Đã xóa phòng ${deleteTarget.name}!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <h3 style={{ margin: 0, color: "#fff" }}>Danh sách khu vực & phòng nuôi trồng</h3>
        <button className="btn btn-primary" onClick={() => { setEditTarget(null); setOpen(true); }}>
          <Plus size={16} /> Thêm phòng mới
        </button>
      </div>

      <div className="trays-grid">
        {data.map((r) => (
          <div className="tray-card" key={r.id}>
            <div className="tray-card-media" style={{ height: 130 }}>
              <img src={FARM_ROOM_IMAGE} alt={r.name} />
              <div className="tray-card-badge-top">
                <StatusBadge status={r.status} />
              </div>
            </div>
            <div className="tray-card-body">
              <div className="tray-card-title-row">
                <span className="tray-card-code">{r.name}</span>
                <span style={{ fontSize: 12, color: "var(--emerald-400)", fontWeight: 600 }}>{r.code}</span>
              </div>
              <p style={{ margin: "4px 0 14px", fontSize: 13, color: "var(--text-muted)" }}>{r.location || "Khu vực nuôi cấy A"}</p>
              
              <div className="tray-meta-grid">
                <div>
                  <span>Số khay đang chứa</span>
                  <b>{r.tray_count ?? 0} Khay</b>
                </div>
                <div>
                  <span>Hệ thống cảm biến</span>
                  <b style={{ color: "var(--emerald-400)" }}>Đã kết nối</b>
                </div>
              </div>

              <div className="tray-card-actions">
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditTarget(r); setOpen(true); }}>
                  Chỉnh sửa
                </button>
                <button className="btn-icon" style={{ color: "#f87171" }} onClick={() => setDeleteTarget(r)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!data.length && <EmptyState title="Chưa có phòng nuôi trồng" desc="Bấm nút Thêm phòng mới để bắt đầu thiết lập khu vực trồng nấm." />}
      </div>

      {open && (
        <Modal title={editTarget ? "Chỉnh sửa phòng nuôi trồng" : "Thêm phòng nuôi trồng mới"} onClose={() => { setOpen(false); setEditTarget(null); }}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Tên phòng</label>
              <input required name="name" className="form-control" defaultValue={editTarget?.name} placeholder="Phòng trồng 01" />
            </div>
            <div className="form-group">
              <label>Mã định danh phòng</label>
              <input required name="code" className="form-control" defaultValue={editTarget?.code} placeholder="ROOM-01" />
            </div>
            <div className="form-group">
              <label>Vị trí địa lý / Khu vực</label>
              <input name="location" className="form-control" defaultValue={editTarget?.location} placeholder="Nhà kính Khu A · Tầng 1" />
            </div>
            <div className="form-group">
              <label>Trạng thái vận hành</label>
              <select name="status" className="form-control" defaultValue={editTarget?.status || "ACTIVE"}>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
              </select>
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setOpen(false); setEditTarget(null); }}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu thông tin</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa phòng trồng"
        message={`Bạn có chắc muốn xóa phòng ${deleteTarget?.name}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ==========================================================================
// 4. PACKAGES VIEW (GÓI THUÊ KHAY — SAAS PRICING CARDS)
// ==========================================================================

function PackagesView({ notify, user }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.packages();
      setData(res || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const payload = {
        name: f.get("name"),
        durationDays: Number(f.get("durationDays")),
        price: Number(f.get("price")),
        description: f.get("description"),
        isActive: f.get("isActive") === "true"
      };

      if (editTarget) {
        await api.updatePackage(editTarget.id, payload);
        notify("Đã cập nhật gói thuê!");
      } else {
        await api.createPackage(payload);
        notify("Đã thêm gói thuê mới!");
      }
      setOpen(false);
      setEditTarget(null);
      loadData();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deletePackage(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
      notify(`Đã xóa gói ${deleteTarget.name}!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Bảng giá các gói thuê khay nấm trực tuyến</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Khách hàng được quyền xem camera 24/7 và nhận toàn bộ sản lượng nấm tươi khi thu hoạch.</p>
        </div>
        {user.role === "ADMIN" && (
          <button className="btn btn-primary" onClick={() => { setEditTarget(null); setOpen(true); }}>
            <Plus size={16} /> Thêm gói mới
          </button>
        )}
      </div>

      <div className="pricing-grid">
        {data.map((pkg, idx) => {
          const isPopular = idx === 0 || pkg.duration_days === 30;
          return (
            <div className={`pricing-card ${isPopular ? "popular" : ""}`} key={pkg.id}>
              {isPopular && <span className="popular-ribbon">Phổ biến nhất</span>}
              <div className="pricing-name">{pkg.name}</div>
              <div className="pricing-desc">{pkg.description || "Gói nuôi trồng trọn gói với chế độ chăm sóc tự động chuẩn VietGAP."}</div>

              <div className="pricing-price-wrap">
                <span className="pricing-price">{Number(pkg.price).toLocaleString("vi-VN")} ₫</span>
                <span className="pricing-period"> / {pkg.duration_days} ngày</span>
              </div>

              <ul className="pricing-features">
                <li><Check size={16} /> Toàn quyền sở hữu khay nấm trong {pkg.duration_days} ngày</li>
                <li><Check size={16} /> Giám sát vi khí hậu nhiệt độ & độ ẩm 24/7</li>
                <li><Check size={16} /> Camera livestream riêng biệt cho từng khay</li>
                <li><Check size={16} /> Tự động thu hoạch và đóng gói bảo quản mát</li>
                <li><Check size={16} /> Hỗ trợ giao nấm tận nhà khi có yêu cầu</li>
              </ul>

              {user.role === "ADMIN" && (
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditTarget(pkg); setOpen(true); }}>
                    Chỉnh sửa
                  </button>
                  <button className="btn-icon" style={{ color: "#f87171" }} onClick={() => setDeleteTarget(pkg)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {open && (
        <Modal title={editTarget ? "Chỉnh sửa gói thuê" : "Thêm gói thuê mới"} onClose={() => { setOpen(false); setEditTarget(null); }}>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Tên gói dịch vụ</label>
              <input required name="name" className="form-control" defaultValue={editTarget?.name} placeholder="Gói 30 ngày cơ bản" />
            </div>
            <div className="form-group">
              <label>Thời hạn nuôi cấy (Số ngày)</label>
              <input type="number" required min="1" name="durationDays" className="form-control" defaultValue={editTarget?.duration_days || 30} />
            </div>
            <div className="form-group">
              <label>Giá dịch vụ trọn gói (VND)</label>
              <input type="number" required min="0" step="10000" name="price" className="form-control" defaultValue={editTarget?.price || 1500000} />
            </div>
            <div className="form-group">
              <label>Mô tả chi tiết quyền lợi</label>
              <textarea name="description" className="form-control" rows={3} defaultValue={editTarget?.description} placeholder="Mô tả các quyền lợi, giống nấm áp dụng..." />
            </div>
            <div className="form-group">
              <label>Trạng thái hiển thị</label>
              <select name="isActive" className="form-control" defaultValue={editTarget ? String(editTarget.is_active) : "true"}>
                <option value="true">Hiển thị cho khách hàng thuê</option>
                <option value="false">Ẩn gói (Ngừng kinh doanh)</option>
              </select>
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setOpen(false); setEditTarget(null); }}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu gói</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa gói thuê"
        message={`Bạn có chắc muốn xóa gói ${deleteTarget?.name}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ==========================================================================
// 5. RENTALS VIEW (HỢP ĐỒNG THUÊ KHAY)
// ==========================================================================

function RentalsView({ notify, user }) {
  const [data, setData] = useState([]);
  const [trays, setTrays] = useState([]);
  const [packages, setPackages] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);

  const loadData = async () => {
    try {
      const [rList, tList, pList] = await Promise.all([
        api.rentals(),
        api.trays("available"),
        api.packages()
      ]);
      setData(rList || []);
      setTrays(tList || []);
      setPackages(pList || []);
      try {
        const uList = await api.users();
        setUsers(uList || []);
      } catch {
        setUsers([]);
      }
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createRental({
        customerId: f.get("customerId"),
        trayId: f.get("trayId"),
        packageId: f.get("packageId")
      });
      setOpen(false);
      loadData();
      notify("Đã gán khay và lập hợp đồng thuê mới thành công!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Hợp đồng thuê khay trực tuyến</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Danh sách các hợp đồng đang hoạt động và lịch sử thanh toán.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Gán khay cho khách hàng
        </button>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Mã hợp đồng</th>
                <th>Khay nấm</th>
                <th>Khách hàng</th>
                <th>Gói dịch vụ</th>
                <th>Ngày bắt đầu</th>
                <th>Hết hạn dự kiến</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id}>
                  <td><code style={{ color: "var(--text-muted)" }}>{x.id.slice(0, 8)}...</code></td>
                  <td><b>{x.tray_code}</b></td>
                  <td>
                    <div><b>{x.customer_name}</b></div>
                    <small style={{ color: "var(--text-muted)" }}>{x.customer_email}</small>
                  </td>
                  <td>
                    <span style={{ color: "var(--emerald-400)", fontWeight: 600 }}>{x.package_name}</span>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{Number(x.price || 0).toLocaleString("vi-VN")} ₫</div>
                  </td>
                  <td>{x.start_date}</td>
                  <td>{x.end_date || "—"}</td>
                  <td><StatusBadge status={x.status} /></td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan={7} style={{ textAlign: "center", padding: 36 }}>Chưa có hợp đồng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title="Gán khay nấm cho khách hàng" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Chọn khách hàng</label>
              <select required name="customerId" className="form-control">
                <option value="">-- Chọn tài khoản khách hàng --</option>
                {users.filter((u) => u.role === "CUSTOMER").map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} · {u.email}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Khay nấm còn trống</label>
              <select required name="trayId" className="form-control">
                <option value="">-- Chọn khay nuôi trống --</option>
                {trays.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.mushroom_type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Gói dịch vụ thuê</label>
              <select required name="packageId" className="form-control">
                <option value="">-- Chọn gói thuê --</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.duration_days} ngày - {Number(p.price).toLocaleString("vi-VN")} ₫)
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Xác nhận hợp đồng</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ==========================================================================
// 6. SENSORS VIEW (DỮ LIỆU CẢM BIẾN REALTIME)
// ==========================================================================

function SensorsView({ notify }) {
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.sensorHistory();
      setData(res || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return data.filter((x) => {
      const matchType = filterType === "all" || x.sensor_type === filterType;
      const matchSearch = !search || (x.tray_code || "").toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [data, filterType, search]);

  return (
    <div>
      <div className="content-toolbar">
        <div className="search-filter-box">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo mã khay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">Tất cả chỉ số</option>
            <option value="TEMPERATURE">Nhiệt độ (°C)</option>
            <option value="HUMIDITY">Độ ẩm (%)</option>
            <option value="CO2">Khí CO₂ (ppm)</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={15} /> Làm mới nhật ký
        </button>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Thời điểm ghi nhận</th>
                <th>Loại cảm biến</th>
                <th>Giá trị đo</th>
                <th>Đơn vị</th>
                <th>Khay gắn kèm</th>
                <th>Đánh giá trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((x, idx) => {
                const isTemp = x.sensor_type === "TEMPERATURE";
                const isHum = x.sensor_type === "HUMIDITY";
                return (
                  <tr key={idx}>
                    <td>{new Date(x.recorded_at).toLocaleString("vi-VN")}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: isTemp ? "var(--temp-color)" : isHum ? "var(--hum-color)" : "var(--co2-color)" }}>
                        {x.sensor_type}
                      </span>
                    </td>
                    <td><b style={{ fontSize: 16 }}>{x.value}</b></td>
                    <td>{x.unit}</td>
                    <td>{x.tray_code || "Toàn phòng"}</td>
                    <td><span className="kpi-badge optimal">Đạt chuẩn</span></td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: 36 }}>Chưa có dữ liệu cảm biến nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 7. DEVICES VIEW (THIẾT BỊ IOT & RELAY CHẤP HÀNH)
// ==========================================================================

function DevicesView({ notify }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    try {
      const devList = await api.devices();
      setData(devList || []);
      const rList = await api.rooms();
      setRooms(rList || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (d) => {
    try {
      const nextOn = !d.is_on;
      const res = await api.toggleDevice(d.id, { isOn: nextOn });
      setData((prev) => prev.map((x) => x.id === d.id ? res : x));
      notify(`Đã ${nextOn ? "BẬT" : "TẮT"} thiết bị ${d.name}`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createDevice({
        name: f.get("name"),
        deviceCode: f.get("deviceCode"),
        deviceType: f.get("deviceType"),
        roomId: f.get("roomId") || null,
        apiKey: f.get("apiKey") || null
      });
      setOpen(false);
      loadData();
      notify("Đã thêm thiết bị IoT mới!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteDevice(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
      notify(`Đã xóa thiết bị ${deleteTarget.name}!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Danh sách thiết bị cảm biến & rơ-le chấp hành</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Điều khiển trực tiếp mạch relay máy phun sương, quạt đối lưu, sưởi và chiếu sáng.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Thêm thiết bị IoT
        </button>
      </div>

      <div className="trays-grid">
        {data.map((d) => (
          <div className="tray-card" key={d.id} style={{ borderTop: d.is_on ? "3px solid var(--emerald-500)" : "3px solid var(--border-card)" }}>
            <div className="tray-card-body">
              <div className="tray-card-title-row">
                <span className="tray-card-code">{d.name}</span>
                <StatusBadge status={d.status} />
              </div>
              <div style={{ fontSize: 13, color: "var(--emerald-400)", fontWeight: 600, marginBottom: 12 }}>
                {d.device_code} · {d.device_type}
              </div>

              <div className="tray-meta-grid">
                <div>
                  <span>Phòng đặt</span>
                  <b>{d.room_name || "Phòng 01"}</b>
                </div>
                <div>
                  <span>Trạng thái Relay</span>
                  <b style={{ color: d.is_on ? "var(--emerald-400)" : "#f87171" }}>{d.is_on ? "ĐANG BẬT" : "TẮT"}</b>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bật / Tắt nguồn:</span>
                <label className="switch">
                  <input type="checkbox" checked={!!d.is_on} onChange={() => handleToggle(d)} />
                  <span className="slider" />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <button className="btn-icon" style={{ width: 30, height: 30, color: "#f87171" }} onClick={() => setDeleteTarget(d)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal title="Thêm thiết bị IoT mới" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Tên thiết bị</label>
              <input required name="name" className="form-control" placeholder="Máy phun sương Phòng 01" />
            </div>
            <div className="form-group">
              <label>Mã định danh phần cứng (Device Code)</label>
              <input required name="deviceCode" className="form-control" placeholder="ACT-MIST-02" />
            </div>
            <div className="form-group">
              <label>Loại thiết bị</label>
              <select name="deviceType" className="form-control">
                <option value="MIST">Máy phun sương ẩm (MIST)</option>
                <option value="FAN">Quạt thông gió đối lưu (FAN)</option>
                <option value="HEATER">Hệ thống sưởi ấm (HEATER)</option>
                <option value="LED">Đèn quang hợp LED</option>
                <option value="ESP32">Mạch Gateway ESP32</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phòng lắp đặt</label>
              <select name="roomId" className="form-control">
                <option value="">Chưa gán phòng</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu thiết bị</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Xác nhận xóa thiết bị"
        message={`Bạn có chắc muốn xóa thiết bị ${deleteTarget?.name}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ==========================================================================
// 8. CAMERA & REFERENCE MEDIA VIEW
// ==========================================================================

function CameraPageView({ notify, user }) {
  const [cameras, setCameras] = useState([]);
  const [referenceMedia, setReferenceMedia] = useState([]);
  const [open, setOpen] = useState(false);
  const [trays, setTrays] = useState([]);
  const [activeStreamModal, setActiveStreamModal] = useState(null);

  const staff = user.role !== "CUSTOMER";

  const loadData = async () => {
    try {
      const cList = await api.cameras();
      setCameras(cList || []);
      const rList = await api.referenceMedia().catch(() => []);
      setReferenceMedia(rList || []);
      if (staff) {
        const tList = await api.trays();
        setTrays(tList || []);
      }
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createCamera({
        name: f.get("name"),
        trayId: f.get("trayId") || null,
        streamUrl: f.get("streamUrl") || null,
        status: "ONLINE"
      });
      setOpen(false);
      loadData();
      notify("Đã thêm camera mới!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Camera giám sát & Thư viện video nuôi trồng</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Giám sát trực tiếp quá trình phát triển của từng khay nấm và tư liệu kỹ thuật nuôi trồng.</p>
        </div>
        {staff && (
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Thêm camera
          </button>
        )}
      </div>

      <h4 style={{ color: "#fff", margin: "16px 0 12px" }}>1. Camera luồng trực tiếp nông trại</h4>
      <div className="trays-grid" style={{ marginBottom: 32 }}>
        {cameras.map((c) => (
          <div className="tray-card" key={c.id}>
            <div className="camera-showcase">
              <img src={FARM_ROOM_IMAGE} alt={c.name} />
              <div className="camera-overlay-badge">
                <span className="badge-live-stream"><Radio size={12} /> CAMERA TRỰC TIẾP</span>
                <span className="badge-type-label">{c.tray_code || "Khay A101"}</span>
              </div>
              <button className="camera-play-overlay-btn" onClick={() => setActiveStreamModal(c)}>
                <Play size={20} fill="#fff" />
              </button>
            </div>
            <div className="tray-card-body">
              <div className="tray-card-title-row">
                <span className="tray-card-code">{c.name}</span>
                <StatusBadge status={c.status} />
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Gắn tại khay: {c.tray_code || "Chưa chỉ định"}</p>
            </div>
          </div>
        ))}
        {!cameras.length && <EmptyState title="Chưa có camera vật lý" desc="Cấu hình thêm camera RTSP/HLS để xem trực tiếp." />}
      </div>

      <h4 style={{ color: "#fff", margin: "16px 0 12px" }}>2. Video Internet và Tư liệu tham khảo kỹ thuật nấm</h4>
      <div className="media-grid-saas">
        {referenceMedia.map((item) => (
          <article className="media-card-saas" key={item.id}>
            {item.type === "INTERNET_VIDEO" ? (
              <iframe
                title={item.title}
                src={item.embedUrl}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={item.imageUrl} alt={item.title} loading="lazy" />
            )}
            <div className="media-card-saas-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="brand-badge" style={{ fontSize: 10 }}>{item.type === "INTERNET_VIDEO" ? "VIDEO INTERNET" : "ẢNH THAM KHẢO"}</span>
                <small style={{ color: "var(--text-dim)" }}>{item.provider}</small>
              </div>
              <h4 style={{ margin: "4px 0", color: "#fff", fontSize: 15 }}>{item.title}</h4>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)" }}>{item.description}</p>
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ marginTop: "auto", fontSize: 12, color: "var(--emerald-400)" }}>
                Mở nguồn chính thức →
              </a>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <Modal title="Thêm camera giám sát" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Tên camera</label>
              <input required name="name" className="form-control" placeholder="Camera Khay A101" />
            </div>
            <div className="form-group">
              <label>Khay giám sát</label>
              <select name="trayId" className="form-control">
                <option value="">Chưa gán khay</option>
                {trays.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.mushroom_type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Stream URL (RTSP / HLS / HTTP)</label>
              <input name="streamUrl" className="form-control" placeholder="https://stream.mushroom.local/live/tray1.m3u8" />
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu camera</button>
            </div>
          </form>
        </Modal>
      )}

      {activeStreamModal && (
        <Modal title={`Livestream trực tuyến · ${activeStreamModal.name}`} onClose={() => setActiveStreamModal(null)}>
          <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", aspectRatio: "16/9", background: "#000", position: "relative" }}>
            <img src={FARM_ROOM_IMAGE} alt="Live stream" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div className="camera-overlay-badge">
              <span className="badge-live-stream"><Radio size={12} /> CAMERA TRỰC TIẾP</span>
              <span className="badge-type-label">1080p · 30 FPS</span>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-secondary)" }}>
            <b>Thông số kỹ thuật:</b> Luồng video được truyền trực tiếp từ camera góc rộng tại khay {activeStreamModal.tray_code || "A101"}.
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==========================================================================
// 9. HARVESTS VIEW (THU HOẠCH & GIAO HÀNG)
// ==========================================================================

function HarvestsView({ notify, user }) {
  const [data, setData] = useState([]);
  const [trays, setTrays] = useState([]);
  const [open, setOpen] = useState(false);

  const loadData = async () => {
    try {
      const [hList, tList] = await Promise.all([
        api.harvests(),
        api.trays().catch(() => [])
      ]);
      setData(hList || []);
      setTrays(tList || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createHarvest({
        trayId: f.get("trayId"),
        quantityKg: Number(f.get("quantityKg") || 0),
        harvestDate: f.get("harvestDate") || null,
        deliveryRequested: f.get("deliveryRequested") === "true",
        note: f.get("note")
      });
      setOpen(false);
      loadData();
      notify("Đã tạo đợt thu hoạch mới thành công!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Nhật ký thu hoạch & Vận chuyển nấm tươi</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Ghi nhận sản lượng nấm thu được từ từng khay và yêu cầu giao hàng tận nơi.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Tạo bản ghi thu hoạch
        </button>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Khay nấm</th>
                <th>Giống nấm</th>
                <th>Sản lượng</th>
                <th>Ngày thu hoạch</th>
                <th>Yêu cầu giao hàng</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id}>
                  <td><b>{x.tray_code}</b></td>
                  <td><span style={{ color: "var(--emerald-400)" }}>{x.mushroom_type}</span></td>
                  <td><b style={{ fontSize: 15 }}>{x.quantity_kg || "—"} kg</b></td>
                  <td>{x.harvest_date}</td>
                  <td>
                    {x.delivery_requested ? (
                      <span className="status-pill active"><Check size={12} /> Giao tận nhà</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Tại trang trại</span>
                    )}
                  </td>
                  <td><StatusBadge status={x.status} /></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{x.note || "—"}</td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan={7} style={{ textAlign: "center", padding: 36 }}>Chưa có bản ghi thu hoạch nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title="Tạo bản ghi thu hoạch" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Khay nấm thu hoạch</label>
              <select required name="trayId" className="form-control">
                <option value="">-- Chọn khay thu hoạch --</option>
                {trays.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.mushroom_type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Khối lượng thực thu (kg)</label>
              <input type="number" step="0.05" min="0" required name="quantityKg" className="form-control" placeholder="1.25" />
            </div>
            <div className="form-group">
              <label>Ngày thu hoạch</label>
              <input type="date" name="harvestDate" className="form-control" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="form-group">
              <label>Giao hàng tận nơi cho khách?</label>
              <select name="deliveryRequested" className="form-control">
                <option value="false">Không (Khách nhận tại farm)</option>
                <option value="true">Có (Đóng gói gửi chuyển phát nhanh)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ghi chú chất lượng</label>
              <textarea name="note" className="form-control" rows={2} placeholder="Nấm tai đều, trắng sạch, đạt chuẩn loại 1..." />
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu thu hoạch</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ==========================================================================
// 10. NOTIFICATIONS VIEW (THÔNG BÁO)
// ==========================================================================

function NotificationsView({ notify }) {
  const [data, setData] = useState([]);

  const loadData = async () => {
    try {
      const res = await api.notifications();
      setData(res || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const markRead = async (id) => {
    try {
      await api.readNotification(id);
      setData((prev) => prev.map((x) => x.id === id ? { ...x, is_read: true } : x));
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Trung tâm thông báo & Cảnh báo môi trường</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Các sự kiện vi khí hậu, cập nhật giai đoạn tơ nấm và yêu cầu thu hoạch.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((x) => {
          const isAlert = x.type === "ALERT";
          return (
            <div
              key={x.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                background: x.is_read ? "var(--bg-card)" : "var(--bg-surface)",
                border: "1px solid",
                borderColor: x.is_read ? "var(--border-subtle)" : isAlert ? "rgba(244, 63, 94, 0.4)" : "var(--border-highlight)",
                borderRadius: "var(--radius-md)",
                borderLeft: isAlert ? "4px solid var(--temp-color)" : "4px solid var(--emerald-400)"
              }}
            >
              <div style={{ color: isAlert ? "var(--temp-color)" : "var(--emerald-400)", flexShrink: 0 }}>
                {isAlert ? <AlertTriangle size={22} /> : <Bell size={22} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <b style={{ color: "#fff", fontSize: 15 }}>{x.title}</b>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(x.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13.5 }}>{x.message}</p>
              </div>
              {!x.is_read && (
                <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => markRead(x.id)}>
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          );
        })}
        {!data.length && <EmptyState title="Hộp thư thông báo trống" desc="Bạn chưa có thông báo mới nào từ hệ thống." />}
      </div>
    </div>
  );
}

// ==========================================================================
// 11. USERS VIEW (NGƯỜI DÙNG & PHÂN QUYỀN)
// ==========================================================================

function UsersView({ notify, user }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const res = await api.users();
      setData(res || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleChangeRole = async (u, newRole) => {
    try {
      await api.updateUser(u.id, { role: newRole });
      setData((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
      notify(`Đã cập nhật quyền của ${u.full_name} thành ${newRole}`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleToggleActive = async (u) => {
    try {
      const nextActive = !u.is_active;
      await api.updateUser(u.id, { isActive: nextActive });
      setData((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: nextActive } : x));
      notify(`Đã ${nextActive ? "kích hoạt" : "khóa"} tài khoản ${u.full_name}`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createUser({
        fullName: f.get("fullName"),
        email: f.get("email"),
        password: f.get("password"),
        role: f.get("role"),
        phone: f.get("phone")
      });
      setOpen(false);
      loadData();
      notify("Đã tạo tài khoản người dùng mới!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      await api.updateUser(userId, { password: newPassword });
      notify("Đã đặt lại mật khẩu người dùng thành công!");
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const filtered = data.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="content-toolbar">
        <div className="search-filter-box">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Tạo tài khoản mới
        </button>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò (Role)</th>
                <th>Trạng thái</th>
                <th>Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar-pill" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {u.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <b>{u.full_name}</b>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ padding: "6px 10px", width: "auto", fontSize: 12.5 }}
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="FARM_OPERATOR">FARM_OPERATOR</option>
                      <option value="CUSTOMER">CUSTOMER</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{
                        padding: "4px 10px",
                        fontSize: 11,
                        background: u.is_active ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: u.is_active ? "var(--emerald-400)" : "#f87171",
                        border: "1px solid",
                        borderColor: u.is_active ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"
                      }}
                      onClick={() => handleToggleActive(u)}
                    >
                      {u.is_active ? "Đang bật" : "Đã khóa"}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setResetTarget(u)}>
                      <KeyRound size={14} /> Đặt lại MK
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <Modal title="Tạo tài khoản người dùng mới" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input required name="fullName" className="form-control" placeholder="Trần Thị B" />
            </div>
            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input type="email" required name="email" className="form-control" placeholder="b@mushroom.local" />
            </div>
            <div className="form-group">
              <label>Mật khẩu khởi tạo</label>
              <input type="password" required minLength={8} name="password" className="form-control" placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input name="phone" className="form-control" placeholder="0988 123 456" />
            </div>
            <div className="form-group">
              <label>Vai trò hệ thống</label>
              <select name="role" className="form-control" defaultValue="CUSTOMER">
                <option value="CUSTOMER">CUSTOMER (Khách hàng)</option>
                <option value="FARM_OPERATOR">FARM_OPERATOR (Kỹ thuật viên Farm)</option>
                <option value="ADMIN">ADMIN (Quản trị viên tối cao)</option>
              </select>
            </div>
            <div className="modal-footer" style={{ margin: "20px -24px -24px", padding: "16px 24px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Hủy</button>
              <button type="submit" className="btn btn-primary">Lưu tài khoản</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modern Masked Password Reset Modal (replaces prompt) */}
      <PasswordResetModal
        open={!!resetTarget}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onReset={handleResetPassword}
      />
    </div>
  );
}

// ==========================================================================
// 12. REPORTS VIEW (BÁO CÁO & XUẤT CSV)
// ==========================================================================

function ReportsView({ notify, user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.reportSummary().then(setData).catch((e) => notify(e.message, "error"));
  }, []);

  const handleExport = async (type) => {
    try {
      await api.exportReport(type);
      notify(`Đã xuất báo cáo ${type}.csv thành công!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Báo cáo tổng kết hiệu suất trang trại</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>Tổng hợp doanh thu, sản lượng thu hoạch và chỉ số vi khí hậu 7 ngày.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Hợp đồng hoạt động</span><Receipt size={18} /></div>
          <div className="kpi-value-row"><span className="kpi-value">{data?.rentals?.active ?? 0}</span></div>
          <div className="kpi-footer"><span className="kpi-range">Tổng hợp đồng: {data?.rentals?.total ?? 0}</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Doanh thu ghi nhận</span><Receipt size={18} color="var(--emerald-400)" /></div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: "var(--emerald-400)", fontSize: 28 }}>
              {Number(data?.rentals?.revenue || 0).toLocaleString("vi-VN")}
            </span>
            <span className="kpi-unit">₫</span>
          </div>
          <div className="kpi-footer"><span className="kpi-range">Doanh thu thuê khay</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Tổng sản lượng thu hoạch</span><Sprout size={18} /></div>
          <div className="kpi-value-row">
            <span className="kpi-value">{data?.harvests?.kg ?? 0}</span>
            <span className="kpi-unit">kg</span>
          </div>
          <div className="kpi-footer"><span className="kpi-range">{data?.harvests?.total ?? 0} Đợt thu hoạch</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header"><span className="kpi-title">Tỷ lệ thành công</span><ShieldCheck size={18} /></div>
          <div className="kpi-value-row"><span className="kpi-value">98.5</span><span className="kpi-unit">%</span></div>
          <div className="kpi-footer"><span className="kpi-range">Chu kỳ tơ nấm chuẩn</span></div>
        </div>
      </div>

      {user.role === "ADMIN" && (
        <div className="dash-panel" style={{ marginBottom: 24 }}>
          <div className="panel-head">
            <h3><Download size={18} color="var(--emerald-400)" /> Xuất báo cáo dữ liệu định dạng CSV</h3>
            <span>Dành cho phân tích Excel & Kế toán</span>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => handleExport("rentals")}>
              <Download size={15} /> Xuất CSV Hợp đồng thuê
            </button>
            <button className="btn btn-primary" onClick={() => handleExport("harvests")}>
              <Download size={15} /> Xuất CSV Thu hoạch nấm
            </button>
            <button className="btn btn-primary" onClick={() => handleExport("environment")}>
              <Download size={15} /> Xuất CSV Vi khí hậu 7 ngày
            </button>
          </div>
        </div>
      )}

      <div className="dash-panel">
        <div className="panel-head">
          <h3><Activity size={18} color="var(--emerald-400)" /> Thống kê trung bình vi khí hậu 7 ngày qua</h3>
          <span>Dữ liệu từ trạm cảm biến</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Chỉ số môi trường</th>
                <th>Trung bình (Avg)</th>
                <th>Thấp nhất (Min)</th>
                <th>Cao nhất (Max)</th>
                <th>Trạng thái đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {(data?.environment || []).map((x) => (
                <tr key={x.sensor_type}>
                  <td><b>{x.sensor_type}</b></td>
                  <td><b style={{ color: "var(--emerald-400)" }}>{x.avg}</b></td>
                  <td>{x.min}</td>
                  <td>{x.max}</td>
                  <td><span className="kpi-badge optimal">Ổn định</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// 13. SETTINGS VIEW (CÀI ĐẶT NGƯỠNG VI KHÍ HẬU)
// ==========================================================================

function SettingsPageView({ notify, user }) {
  const [data, setData] = useState([]);

  const loadData = async () => {
    try {
      const res = await api.thresholds();
      setData(res || []);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e, row) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.saveThresholds({
        roomId: row.room_id,
        temperatureMin: Number(f.get("temperatureMin")),
        temperatureMax: Number(f.get("temperatureMax")),
        humidityMin: Number(f.get("humidityMin")),
        humidityMax: Number(f.get("humidityMax")),
        co2Max: Number(f.get("co2Max"))
      });
      loadData();
      notify(`Đã lưu ngưỡng môi trường cho ${row.room_name || "Mặc định"}!`);
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div>
      <div className="content-toolbar">
        <div>
          <h3 style={{ margin: 0, color: "#fff" }}>Cài đặt ngưỡng kích hoạt tự động vi khí hậu</h3>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>
            Khi nhiệt độ hoặc độ ẩm vượt khỏi ngưỡng này, hệ thống sẽ tự động kích hoạt máy phun sương hoặc quạt đối lưu.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {data.map((row) => (
          <div className="dash-panel" key={row.id}>
            <div className="panel-head">
              <h3><Settings size={18} color="var(--emerald-400)" /> {row.room_name || "Ngưỡng mặc định toàn trang trại"}</h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Cập nhật lần cuối: {new Date(row.updated_at || Date.now()).toLocaleDateString("vi-VN")}</span>
            </div>

            <form onSubmit={(e) => handleSave(e, row)}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 18 }}>
                <div className="form-group">
                  <label>Nhiệt độ tối thiểu (°C)</label>
                  <input
                    name="temperatureMin"
                    type="number"
                    step="0.1"
                    className="form-control"
                    defaultValue={row.temperature_min}
                    disabled={user.role !== "ADMIN"}
                  />
                </div>
                <div className="form-group">
                  <label>Nhiệt độ tối đa (°C)</label>
                  <input
                    name="temperatureMax"
                    type="number"
                    step="0.1"
                    className="form-control"
                    defaultValue={row.temperature_max}
                    disabled={user.role !== "ADMIN"}
                  />
                </div>
                <div className="form-group">
                  <label>Độ ẩm tối thiểu (%)</label>
                  <input
                    name="humidityMin"
                    type="number"
                    step="0.1"
                    className="form-control"
                    defaultValue={row.humidity_min}
                    disabled={user.role !== "ADMIN"}
                  />
                </div>
                <div className="form-group">
                  <label>Độ ẩm tối đa (%)</label>
                  <input
                    name="humidityMax"
                    type="number"
                    step="0.1"
                    className="form-control"
                    defaultValue={row.humidity_max}
                    disabled={user.role !== "ADMIN"}
                  />
                </div>
                <div className="form-group">
                  <label>Nồng độ CO₂ tối đa (ppm)</label>
                  <input
                    name="co2Max"
                    type="number"
                    step="10"
                    className="form-control"
                    defaultValue={row.co2_max}
                    disabled={user.role !== "ADMIN"}
                  />
                </div>
              </div>

              {user.role === "ADMIN" && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn btn-primary">
                    Lưu ngưỡng kích hoạt
                  </button>
                </div>
              )}
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
