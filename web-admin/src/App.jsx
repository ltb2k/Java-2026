import React, { useEffect, useState } from "react";
import { Activity, Bell, Camera, CircleGauge, Cloud, FileDown, Leaf, Lightbulb, LogOut, Menu, Package, Plus, Power, Receipt, RefreshCw, Settings, Sprout, Thermometer, Trash2, Users, Wind, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as api from "./services/api";

const allMenu = [
  ["dashboard", "Dashboard", CircleGauge, null],
  ["trays", "Khay nuôi trồng", Leaf, null],
  ["rooms", "Phòng trồng", Cloud, "staff"],
  ["packages", "Gói thuê", Package, "ADMIN"],
  ["rentals", "Thuê khay", Receipt, "staff"],
  ["sensors", "Dữ liệu cảm biến", Activity, null],
  ["devices", "Thiết bị IoT", Power, "staff"],
  ["camera", "Camera", Camera, null],
  ["notifications", "Thông báo", Bell, null],
  ["users", "Người dùng", Users, "ADMIN"],
  ["harvests", "Thu hoạch", Sprout, null],
  ["reports", "Báo cáo", FileDown, "staff"],
  ["settings", "Cài đặt", Settings, "staff"]
];

const fallback = [
  { time: "00:00", humidity: 86, temp: 24.2 },
  { time: "06:00", humidity: 92, temp: 24.8 },
  { time: "12:00", humidity: 87, temp: 27.2 },
  { time: "18:00", humidity: 91, temp: 25.5 }
];

function canSee(item, role) {
  const need = item[3];
  if (!need) return true;
  if (need === "ADMIN") return role === "ADMIN";
  if (need === "staff") return role === "ADMIN" || role === "FARM_OPERATOR";
  return true;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg">
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setLoading(true); setErr(""); setNotice("");
    try {
      if (mode === "register") {
        if (password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
        await api.register(fullName, email, password, phone);
        setMode("login"); setPassword("");
        setNotice("Tạo tài khoản thành công. Đăng nhập bằng email và mật khẩu vừa tạo.");
      } else {
        const r = await api.login(email, password);
        localStorage.setItem("token", r.token);
        localStorage.setItem("user", JSON.stringify(r.user));
        onLogin(r.user);
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="login">
      <form onSubmit={go}>
        <div className="logo big"><Sprout /></div>
        <h1>MUSHROOM SMART FARM</h1>
        <p>{mode === "login" ? "Đăng nhập hệ thống quản lý nấm" : "Tạo tài khoản thành viên"}</p>
        {err && <div className="error">{err}</div>}
        {notice && <div className="success">{notice}</div>}
        {mode === "register" && <label>Họ và tên<input required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" /></label>}
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
        {mode === "register" && <label>Số điện thoại (không bắt buộc)<input value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>}
        <label>Mật khẩu<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        <button className="primary full" disabled={loading}>{loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button>
        <button type="button" className="secondary full" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); setNotice(""); }}>
          {mode === "login" ? "Chưa có tài khoản? Đăng ký thành viên" : "Đã có tài khoản? Quay lại đăng nhập"}
        </button>
        {mode === "login" && <small>Tài khoản đăng ký mới có quyền CUSTOMER. Tài khoản quản trị do quản trị viên tạo.</small>}
      </form>
    </div>
  );
}

function SensorCard({ Icon, title, value, unit, note, cls }) {
  return (
    <div className={"sensor " + cls}>
      <div className="st"><span>{title}</span><Icon size={20} /></div>
      <div className="sv">{value}<small>{unit}</small></div>
      <div className="sn">{note}</div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(() => Boolean(localStorage.getItem("token")));
  const [page, setPage] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [toast, setToast] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    const clearSession = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (active) { setUser(null); setAuthChecking(false); }
    };
    window.addEventListener("auth:expired", clearSession);
    if (localStorage.getItem("token")) {
      api.me().then((current) => {
        if (!active) return;
        setUser(current);
        localStorage.setItem("user", JSON.stringify(current));
      }).catch(clearSession).finally(() => {
        if (active) setAuthChecking(false);
      });
    } else {
      setAuthChecking(false);
    }
    return () => {
      active = false;
      window.removeEventListener("auth:expired", clearSession);
    };
  }, []);
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };
  const notify = (x) => { setToast(x); setTimeout(() => setToast(""), 2500); };
  if (authChecking) return <div className="login"><p>Đang kiểm tra phiên đăng nhập...</p></div>;
  if (!user) return <Login onLogin={(current) => { setUser(current); setAuthChecking(false); }} />;
  const menu = allMenu.filter((item) => canSee(item, user.role));
  return (
    <div className="app">
      <aside className={sidebar ? "side" : "side col"}>
        <div className="brand">
          <div className="logo"><Sprout /></div>
          {sidebar && <div><b>MUSHROOM</b><span>SMART FARM</span></div>}
        </div>
        <nav>
          {menu.map(([id, label, Icon]) => (
            <button key={id} className={page === id ? "nav active" : "nav"} onClick={() => setPage(id)}>
              <Icon />{sidebar && label}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}><LogOut />{sidebar && "Đăng xuất"}</button>
      </aside>
      <main>
        <header>
          <button className="icon-btn" onClick={() => setSidebar(!sidebar)}><Menu /></button>
          <div>
            <h1>Nhà Trồng Nấm Thông Minh</h1>
            <p>Xin chào {user.fullName} · {user.role}</p>
          </div>
          <div className="actions">
            <span className="online">● IoT API</span>
            <button className="secondary" onClick={() => setRefresh((x) => x + 1)}><RefreshCw size={16} /> Làm mới</button>
          </div>
        </header>
        {toast && <div className="toast">{toast}</div>}
        <Page page={page} refresh={refresh} notify={notify} user={user} />
      </main>
    </div>
  );
}

function Page({ page, refresh, notify, user }) {
  switch (page) {
    case "dashboard": return <Dashboard refresh={refresh} notify={notify} />;
    case "trays": return <Trays notify={notify} user={user} />;
    case "rooms": return <Rooms notify={notify} />;
    case "packages": return <Packages notify={notify} />;
    case "rentals": return <Rentals notify={notify} />;
    case "sensors": return <Sensors />;
    case "devices": return <Devices notify={notify} />;
    case "camera": return <CameraPage notify={notify} user={user} />;
    case "notifications": return <Notifications notify={notify} />;
    case "users": return <UsersPage notify={notify} />;
    case "harvests": return <Harvests notify={notify} user={user} />;
    case "reports": return <Reports notify={notify} user={user} />;
    case "settings": return <SettingsPage notify={notify} user={user} />;
    default: return null;
  }
}

function Dashboard({ refresh, notify }) {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState(fallback);
  const [dev, setDev] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const [d, h] = await Promise.all([api.dashboard(), api.sensorHistory()]);
        setData(d);
        try { setDev(await api.devices()); } catch { setDev([]); }
        const by = {};
        h.forEach((x) => {
          const k = new Date(x.recorded_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          by[k] ??= { time: k };
          if (x.sensor_type === "HUMIDITY") by[k].humidity = +x.value;
          if (x.sensor_type === "TEMPERATURE") by[k].temp = +x.value;
        });
        if (Object.keys(by).length) setChart(Object.values(by).slice(-24));
      } catch (e) { notify(e.message); }
    })();
  }, [refresh]);
  const c = data?.current || { temperature: 25.8, humidity: 89.2, co2: 640 };
  const f = data?.featured;
  const toggle = async (d) => {
    try {
      const r = await api.toggleDevice(d.id, { isOn: !d.is_on });
      setDev((v) => v.map((x) => x.id === d.id ? r : x));
      notify("Đã cập nhật " + d.name);
    } catch (e) { notify(e.message); }
  };
  return (
    <>
      <section className="rental">
        <div><span>Mã định danh khay</span><b>{f?.code || "—"}</b><small>{f?.room_name || "Chưa có khay nổi bật"}{f?.rack ? " · " + f.rack : ""}</small></div>
        <div><span>Giống nấm</span><b>{f?.mushroom_type || "—"}</b><small>{f?.status || ""}</small></div>
        <div><span>Khách hàng thuê</span><b>{f?.customer_name || "Chưa gán"}</b><small>{f?.package_name || ""}</small></div>
        <div><span>Chu kỳ sinh trưởng</span><b className="cyan">Ngày {f?.growth_day ?? 0}</b><small>{f?.stage || "Chưa cập nhật giai đoạn"}</small></div>
      </section>
      <section className="sensors">
        <SensorCard Icon={Thermometer} title="Nhiệt độ" value={Number(c.temperature).toFixed(1)} unit="°C" note="Ngưỡng: 24 – 28 °C" cls="temp" />
        <SensorCard Icon={Cloud} title="Độ ẩm" value={Number(c.humidity).toFixed(1)} unit="%" note="Ngưỡng: 85 – 95 %" cls="hum" />
        <SensorCard Icon={Wind} title="CO₂" value={Math.round(c.co2)} unit="ppm" note="Mức tối đa: < 800 ppm" cls="co2" />
        <SensorCard Icon={Lightbulb} title="Thiết bị online" value={data?.counts.onlineDevices ?? 0} unit="" note="ESP32 / actuator" cls="lux" />
      </section>
      <section className="grid">
        <div className="panel">
          <div className="ph"><div><h2>Camera trực tuyến</h2><span>{f?.code || "Chưa gán khay"} · RTSP / HLS</span></div><Camera /></div>
          <div className="camera"><div className="live">● GIÁM SÁT</div><Sprout size={85} /><span>CAMERA FEED</span></div>
        </div>
        <div className="panel control">
          <div className="ph"><div><h2>Điều khiển vi khí hậu</h2><span>{dev.length} thiết bị</span></div><Power /></div>
          {dev.length ? dev.slice(0, 5).map((d) => (
            <div className="device" key={d.id}>
              <Power size={18} />
              <div className="di"><b>{d.name}</b><span>{d.device_code} · {d.device_type} · {d.is_on ? "ON" : "OFF"}</span></div>
              <button className={d.is_on ? "on" : "off"} onClick={() => toggle(d)}>{d.is_on ? "BẬT" : "TẮT"}</button>
            </div>
          )) : <div className="empty">Không có quyền xem thiết bị hoặc chưa có thiết bị</div>}
        </div>
      </section>
      <section className="grid">
        <div className="panel chartpanel">
          <div className="ph"><div><h2>Biểu đồ môi trường</h2><span>24 giờ qua</span></div><Activity /></div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid stroke="#243553" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#73819a" />
                <YAxis yAxisId="l" domain={[70, 100]} stroke="#38bdf8" />
                <YAxis yAxisId="r" orientation="right" domain={[20, 35]} stroke="#f87171" />
                <Tooltip /><Legend />
                <Line yAxisId="l" type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#38bdf8" strokeWidth={3} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#f87171" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel stats">
          <h2>Thống kê hệ thống</h2>
          <Stat n={data?.counts.rooms ?? 0} t="Phòng trồng" />
          <Stat n={data?.counts.trays ?? 0} t="Khay nuôi" />
          <Stat n={data?.counts.customers ?? 0} t="Khách hàng" />
          <Stat n={data?.counts.onlineDevices ?? 0} t="Thiết bị online" />
        </div>
      </section>
    </>
  );
}

function Stat({ n, t }) { return <div className="stat"><b>{n}</b><span>{t}</span></div>; }

function Trays({ notify, user }) {
  const [data, setData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(null);
  const staff = user.role !== "CUSTOMER";
  const load = async () => {
    try {
      setData(await api.trays());
      if (staff) setRooms(await api.rooms());
    } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createTray({
        roomId: f.get("roomId") || null, code: f.get("code"), mushroomType: f.get("mushroomType"),
        rack: f.get("rack"), status: f.get("status"), growthDay: Number(f.get("growthDay") || 0),
        expectedHarvestDate: f.get("expectedHarvestDate") || null
      });
      setOpen(false); load(); notify("Đã thêm khay");
    } catch (e) { notify(e.message); }
  };
  const saveProgress = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createProgress({
        trayId: progressOpen.id, stage: f.get("stage"),
        progressPercent: Number(f.get("progressPercent") || 0), note: f.get("note")
      });
      setProgressOpen(null); load(); notify("Đã cập nhật tiến độ");
    } catch (e) { notify(e.message); }
  };
  const del = async (id) => {
    if (!confirm("Xóa khay này?")) return;
    try { await api.deleteTray(id); load(); notify("Đã xóa khay"); }
    catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Khay nuôi trồng" action={staff && <button className="primary" onClick={() => setOpen(true)}><Plus /> Thêm khay</button>}>
      <table>
        <thead><tr><th>Mã khay</th><th>Loại nấm</th><th>Phòng</th><th>Khách</th><th>Trạng thái</th><th>Giai đoạn</th><th></th></tr></thead>
        <tbody>{data.map((x) => (
          <tr key={x.id}>
            <td><b>{x.code}</b></td><td>{x.mushroom_type}</td><td>{x.room_name || "—"}</td>
            <td>{x.customer_name || "—"}</td><td><span className="badge">{x.status}</span></td>
            <td>{x.latest_stage || "—"}</td>
            <td>
              {staff && <button className="secondary" onClick={() => setProgressOpen(x)}>Tiến độ</button>}
              {staff && <button className="danger-icon" onClick={() => del(x.id)}><Trash2 /></button>}
            </td>
          </tr>
        ))}</tbody>
      </table>
      {open && <Modal title="Thêm khay nuôi" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Mã khay<input name="code" required placeholder="TRAY-A102" /></label>
          <label>Giống nấm<input name="mushroomType" required placeholder="Nấm Bào Ngư Xám" /></label>
          <label>Phòng<select name="roomId"><option value="">Chưa gán</option>{rooms.map((r) => <option value={r.id} key={r.id}>{r.name}</option>)}</select></label>
          <label>Kệ<input name="rack" placeholder="Kệ 01" /></label>
          <label>Trạng thái<select name="status"><option>AVAILABLE</option><option>RENTED</option><option>GROWING</option><option>HARVEST_READY</option></select></label>
          <label>Ngày nuôi<input name="growthDay" type="number" defaultValue="0" min="0" /></label>
          <label>Ngày thu hoạch dự kiến<input name="expectedHarvestDate" type="date" /></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
      {progressOpen && <Modal title={"Tiến độ " + progressOpen.code} onClose={() => setProgressOpen(null)}>
        <form className="form" onSubmit={saveProgress}>
          <label>Giai đoạn<input name="stage" required placeholder="Ra quả thể" /></label>
          <label>Tiến độ (%)<input name="progressPercent" type="number" min="0" max="100" defaultValue={progressOpen.progress_percent || 0} /></label>
          <label>Ghi chú<textarea name="note" /></label>
          <button className="primary full">Cập nhật</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Rooms({ notify }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => api.rooms().then(setData).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createRoom({ name: f.get("name"), code: f.get("code"), location: f.get("location") });
      setOpen(false); load(); notify("Đã thêm phòng");
    } catch (e) { notify(e.message); }
  };
  const del = async (id) => {
    if (!confirm("Xóa phòng?")) return;
    try { await api.deleteRoom(id); load(); notify("Đã xóa"); }
    catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Phòng trồng" action={<button className="primary" onClick={() => setOpen(true)}><Plus /> Thêm phòng</button>}>
      <table>
        <thead><tr><th>Tên phòng</th><th>Mã</th><th>Vị trí</th><th>Số khay</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>{data.map((x) => (
          <tr key={x.id}><td><b>{x.name}</b></td><td>{x.code}</td><td>{x.location || "—"}</td><td>{x.tray_count}</td><td><span className="badge">{x.status}</span></td>
            <td><button className="danger-icon" onClick={() => del(x.id)}><Trash2 /></button></td></tr>
        ))}</tbody>
      </table>
      {open && <Modal title="Thêm phòng" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Tên phòng<input name="name" required /></label>
          <label>Mã phòng<input name="code" required placeholder="ROOM-02" /></label>
          <label>Vị trí<input name="location" placeholder="Khu B" /></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Packages({ notify }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => api.packages().then(setData).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createPackage({ name: f.get("name"), durationDays: Number(f.get("durationDays")), price: Number(f.get("price")), description: f.get("description") });
      setOpen(false); load(); notify("Đã thêm gói thuê");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Gói thuê" action={<button className="primary" onClick={() => setOpen(true)}><Plus /> Thêm gói</button>}>
      <table>
        <thead><tr><th>Tên gói</th><th>Số ngày</th><th>Giá</th><th>Mô tả</th><th>Trạng thái</th></tr></thead>
        <tbody>{data.map((x) => (
          <tr key={x.id}><td><b>{x.name}</b></td><td>{x.duration_days}</td><td>{Number(x.price).toLocaleString("vi-VN")} ₫</td><td>{x.description}</td><td>{x.is_active ? "Active" : "Ẩn"}</td></tr>
        ))}</tbody>
      </table>
      {open && <Modal title="Thêm gói thuê" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Tên gói<input name="name" required /></label>
          <label>Số ngày<input name="durationDays" type="number" required min="1" /></label>
          <label>Giá (VND)<input name="price" type="number" required min="0" /></label>
          <label>Mô tả<textarea name="description" /></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Rentals({ notify }) {
  const [data, setData] = useState([]);
  const [trays, setTrays] = useState([]);
  const [packages, setPackages] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => Promise.all([api.rentals(), api.trays("available"), api.packages()]).then(([r, t, p]) => {
    setData(r); setTrays(t); setPackages(p);
  }).catch((e) => notify(e.message));
  useEffect(() => {
    load();
    api.users().then(setUsers).catch(() => setUsers([]));
  }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createRental({ trayId: f.get("trayId"), packageId: f.get("packageId"), customerId: f.get("customerId") });
      setOpen(false); load(); notify("Đã gán khay cho khách");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Thuê khay" action={<button className="primary" onClick={() => setOpen(true)}><Plus /> Gán khay</button>}>
      <table>
        <thead><tr><th>Khay</th><th>Khách hàng</th><th>Gói</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th></tr></thead>
        <tbody>{data.map((x) => (
          <tr key={x.id}><td>{x.tray_code}</td><td>{x.customer_name}</td><td>{x.package_name}</td><td>{x.start_date}</td><td>{x.end_date}</td><td><span className="badge">{x.status}</span></td></tr>
        ))}</tbody>
      </table>
      {open && <Modal title="Gán khay cho khách" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Khách hàng<select name="customerId" required>{users.filter((u) => u.role === "CUSTOMER").map((u) => <option key={u.id} value={u.id}>{u.full_name} · {u.email}</option>)}</select></label>
          <label>Khay trống<select name="trayId" required>{trays.map((x) => <option key={x.id} value={x.id}>{x.code}</option>)}</select></label>
          <label>Gói thuê<select name="packageId" required>{packages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Sensors() {
  const [data, setData] = useState([]);
  useEffect(() => { api.sensorHistory().then(setData).catch(() => {}); }, []);
  return (
    <PageTable title="Dữ liệu cảm biến">
      <table>
        <thead><tr><th>Thời gian</th><th>Loại</th><th>Giá trị</th><th>Đơn vị</th><th>Khay</th></tr></thead>
        <tbody>{data.map((x, i) => (
          <tr key={i}><td>{new Date(x.recorded_at).toLocaleString("vi-VN")}</td><td>{x.sensor_type}</td><td><b>{x.value}</b></td><td>{x.unit}</td><td>{x.tray_code || "—"}</td></tr>
        ))}</tbody>
      </table>
    </PageTable>
  );
}

function Devices({ notify }) {
  const [data, setData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => api.devices().then(setData).catch((e) => notify(e.message));
  useEffect(() => { load(); api.rooms().then(setRooms).catch(() => {}); }, []);
  const toggle = async (x) => {
    try {
      const r = await api.toggleDevice(x.id, { isOn: !x.is_on });
      setData((v) => v.map((d) => d.id === x.id ? r : d));
      notify("Đã đổi trạng thái thiết bị");
    } catch (e) { notify(e.message); }
  };
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createDevice({
        name: f.get("name"), deviceCode: f.get("deviceCode"), deviceType: f.get("deviceType"),
        roomId: f.get("roomId") || null, apiKey: f.get("apiKey") || null
      });
      setOpen(false); load(); notify("Đã thêm thiết bị");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Thiết bị IoT" action={<button className="primary" onClick={() => setOpen(true)}><Plus /> Thêm thiết bị</button>}>
      <div className="cards">{data.map((x) => (
        <div className="device-card" key={x.id}>
          <Power /><h3>{x.name}</h3><p>{x.device_code} · {x.device_type}</p>
          <span className={x.status === "ONLINE" ? "good" : "muted"}>● {x.status} · {x.is_on ? "ON" : "OFF"}</span>
          <button className={x.is_on ? "on" : "off"} onClick={() => toggle(x)}>{x.is_on ? "Tắt" : "Bật"}</button>
        </div>
      ))}</div>
      {open && <Modal title="Thêm thiết bị IoT" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Tên<input name="name" required /></label>
          <label>Mã thiết bị<input name="deviceCode" required placeholder="ESP32-ROOM-02" /></label>
          <label>Loại<select name="deviceType"><option>ESP32</option><option>MIST</option><option>FAN</option><option>LED</option><option>HEATER</option></select></label>
          <label>Phòng<select name="roomId"><option value="">Chưa gán</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          <label>API key (ESP32)<input name="apiKey" placeholder="demo-iot-key" /></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function CameraPage({ notify, user }) {
  const [data, setData] = useState([]);
  const [trays, setTrays] = useState([]);
  const [open, setOpen] = useState(false);
  const staff = user.role !== "CUSTOMER";
  const load = () => api.cameras().then(setData).catch(() => {});
  useEffect(() => { load(); if (staff) api.trays().then(setTrays).catch(() => {}); }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createCamera({ name: f.get("name"), trayId: f.get("trayId") || null, streamUrl: f.get("streamUrl"), status: "ONLINE" });
      setOpen(false); load(); notify("Đã thêm camera");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Camera giám sát" action={staff && <button className="primary" onClick={() => setOpen(true)}><Plus /> Thêm camera</button>}>
      <div className="cards">{data.map((x) => (
        <div className="camera-card" key={x.id}>
          <div className="camera small"><Camera size={55} /><span>{x.status}</span></div>
          <h3>{x.name}</h3><p>Khay: {x.tray_code || "—"}</p>
          <small>{x.stream_url || "Chưa cấu hình stream URL"}</small>
        </div>
      ))}</div>
      {open && <Modal title="Thêm camera" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Tên<input name="name" required /></label>
          <label>Khay<select name="trayId"><option value="">Chưa gán</option>{trays.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}</select></label>
          <label>Stream URL<input name="streamUrl" placeholder="https://.../hls.m3u8" /></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Notifications({ notify }) {
  const [data, setData] = useState([]);
  const load = () => api.notifications().then(setData).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);
  const read = async (id) => { try { await api.readNotification(id); load(); } catch (e) { notify(e.message); } };
  return (
    <PageTable title="Thông báo">
      <div className="notice-list">
        {data.length ? data.map((x) => (
          <div className={"notice-row " + (!x.is_read ? "unread" : "")} key={x.id}>
            <Bell />
            <div><b>{x.title}</b><p>{x.message}</p><small>{new Date(x.created_at).toLocaleString("vi-VN")}</small></div>
            {!x.is_read && <button className="secondary" onClick={() => read(x.id)}>Đã đọc</button>}
          </div>
        )) : <div className="empty">Chưa có thông báo</div>}
      </div>
    </PageTable>
  );
}

function UsersPage({ notify }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => api.users().then(setData).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);
  const change = async (x, role) => {
    try {
      const r = await api.updateUser(x.id, { role });
      setData((v) => v.map((u) => u.id === x.id ? { ...u, ...r, role } : u));
      notify("Đã cập nhật role");
    } catch (e) { notify(e.message); }
  };
  const toggleActive = async (x) => {
    try {
      const r = await api.updateUser(x.id, { isActive: !x.is_active });
      setData((v) => v.map((u) => u.id === x.id ? { ...u, ...r } : u));
    } catch (e) { notify(e.message); }
  };
  const resetPw = async (x) => {
    const password = prompt("Mật khẩu mới (tối thiểu 8 ký tự):");
    if (!password) return;
    try { await api.updateUser(x.id, { password }); notify("Đã đặt lại mật khẩu"); }
    catch (e) { notify(e.message); }
  };
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createUser({ fullName: f.get("fullName"), email: f.get("email"), password: f.get("password"), role: f.get("role"), phone: f.get("phone") });
      setOpen(false); load(); notify("Đã tạo tài khoản");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Người dùng" action={<button className="primary" onClick={() => setOpen(true)}><Plus /> Tạo tài khoản</button>}>
      <table>
        <thead><tr><th>Họ tên</th><th>Email</th><th>Role</th><th>Hoạt động</th><th></th></tr></thead>
        <tbody>{data.map((x) => (
          <tr key={x.id}>
            <td>{x.full_name}</td><td>{x.email}</td>
            <td><select value={x.role} onChange={(e) => change(x, e.target.value)}><option>ADMIN</option><option>FARM_OPERATOR</option><option>CUSTOMER</option></select></td>
            <td><button className="secondary" onClick={() => toggleActive(x)}>{x.is_active ? "Đang bật" : "Đã khóa"}</button></td>
            <td><button className="secondary" onClick={() => resetPw(x)}>Reset MK</button></td>
          </tr>
        ))}</tbody>
      </table>
      {open && <Modal title="Tạo tài khoản" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Họ tên<input name="fullName" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Mật khẩu<input name="password" type="password" required minLength={8} /></label>
          <label>Điện thoại<input name="phone" /></label>
          <label>Role<select name="role"><option>FARM_OPERATOR</option><option>ADMIN</option><option>CUSTOMER</option></select></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Harvests({ notify, user }) {
  const [data, setData] = useState([]);
  const [trays, setTrays] = useState([]);
  const [open, setOpen] = useState(false);
  const load = () => Promise.all([api.harvests(), api.trays()]).then(([h, t]) => { setData(h); setTrays(t); }).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.createHarvest({
        trayId: f.get("trayId"), quantityKg: Number(f.get("quantityKg") || 0),
        harvestDate: f.get("harvestDate") || null, deliveryRequested: f.get("deliveryRequested") === "true", note: f.get("note")
      });
      setOpen(false); load(); notify("Đã tạo bản ghi thu hoạch");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Thu hoạch" action={<button className="primary" onClick={() => setOpen(true)}><Plus /> Tạo thu hoạch</button>}>
      <table>
        <thead><tr><th>Khay</th><th>Loại nấm</th><th>Khối lượng</th><th>Ngày</th><th>Giao hàng</th><th>Trạng thái</th></tr></thead>
        <tbody>{data.map((x) => (
          <tr key={x.id}><td>{x.tray_code}</td><td>{x.mushroom_type}</td><td>{x.quantity_kg || "—"} kg</td><td>{x.harvest_date}</td><td>{x.delivery_requested ? "Có" : "Không"}</td><td><span className="badge">{x.status}</span></td></tr>
        ))}</tbody>
      </table>
      {open && <Modal title="Tạo bản ghi thu hoạch" onClose={() => setOpen(false)}>
        <form className="form" onSubmit={save}>
          <label>Khay<select name="trayId" required>{trays.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.mushroom_type}</option>)}</select></label>
          <label>Khối lượng (kg)<input name="quantityKg" type="number" step="0.01" /></label>
          <label>Ngày thu hoạch<input name="harvestDate" type="date" /></label>
          <label>Yêu cầu giao hàng<select name="deliveryRequested"><option value="false">Không</option><option value="true">Có</option></select></label>
          <label>Ghi chú<textarea name="note" /></label>
          <button className="primary full">Lưu</button>
        </form>
      </Modal>}
    </PageTable>
  );
}

function Reports({ notify, user }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.reportSummary().then(setData).catch((e) => notify(e.message)); }, []);
  const exp = async (type) => {
    try { await api.exportReport(type); notify("Đã tải " + type + ".csv"); }
    catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Báo cáo">
      <div className="stats">
        <h2>Hiệu suất</h2>
        <Stat n={data?.rentals.active ?? 0} t="Hợp đồng đang thuê" />
        <Stat n={Number(data?.rentals.revenue || 0).toLocaleString("vi-VN")} t="Doanh thu ghi nhận (₫)" />
        <Stat n={data?.harvests.total ?? 0} t="Bản ghi thu hoạch" />
        <Stat n={data?.harvests.kg ?? 0} t="Tổng kg" />
      </div>
      <div className="setting-grid" style={{ marginTop: 18 }}>
        {user.role === "ADMIN" && <>
          <button className="primary" onClick={() => exp("rentals")}>Xuất CSV thuê khay</button>
          <button className="primary" onClick={() => exp("harvests")}>Xuất CSV thu hoạch</button>
          <button className="primary" onClick={() => exp("environment")}>Xuất CSV môi trường</button>
        </>}
      </div>
      <table style={{ marginTop: 18 }}>
        <thead><tr><th>Chỉ số 7 ngày</th><th>TB</th><th>Min</th><th>Max</th></tr></thead>
        <tbody>{(data?.environment || []).map((x) => (
          <tr key={x.sensor_type}><td>{x.sensor_type}</td><td>{x.avg}</td><td>{x.min}</td><td>{x.max}</td></tr>
        ))}</tbody>
      </table>
    </PageTable>
  );
}

function SettingsPage({ notify, user }) {
  const [data, setData] = useState([]);
  const load = () => api.thresholds().then(setData).catch((e) => notify(e.message));
  useEffect(() => { load(); }, []);
  const save = async (e, row) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api.saveThresholds({
        roomId: row.room_id,
        temperatureMin: Number(f.get("temperatureMin")), temperatureMax: Number(f.get("temperatureMax")),
        humidityMin: Number(f.get("humidityMin")), humidityMax: Number(f.get("humidityMax")),
        co2Max: Number(f.get("co2Max"))
      });
      load(); notify("Đã lưu ngưỡng");
    } catch (e) { notify(e.message); }
  };
  return (
    <PageTable title="Cài đặt ngưỡng môi trường">
      {data.map((row) => (
        <form className="form" key={row.id} onSubmit={(e) => save(e, row)} style={{ marginBottom: 24 }}>
          <h3>{row.room_name || "Ngưỡng mặc định"}</h3>
          <div className="setting-grid">
            <label>Nhiệt độ min<input name="temperatureMin" type="number" step="0.1" defaultValue={row.temperature_min} disabled={user.role !== "ADMIN"} /></label>
            <label>Nhiệt độ max<input name="temperatureMax" type="number" step="0.1" defaultValue={row.temperature_max} disabled={user.role !== "ADMIN"} /></label>
            <label>Độ ẩm min<input name="humidityMin" type="number" step="0.1" defaultValue={row.humidity_min} disabled={user.role !== "ADMIN"} /></label>
            <label>Độ ẩm max<input name="humidityMax" type="number" step="0.1" defaultValue={row.humidity_max} disabled={user.role !== "ADMIN"} /></label>
            <label>CO₂ max<input name="co2Max" type="number" step="1" defaultValue={row.co2_max} disabled={user.role !== "ADMIN"} /></label>
          </div>
          {user.role === "ADMIN" && <button className="primary">Lưu ngưỡng</button>}
        </form>
      ))}
    </PageTable>
  );
}

function PageTable({ title, action, children }) {
  return (
    <section className="page">
      <div className="page-head">
        <div><h2>{title}</h2><p>Quản lý dữ liệu trực tiếp qua REST API / PostgreSQL</p></div>
        {action}
      </div>
      <div className="panel tablepanel">{children}</div>
    </section>
  );
}

export default App;
