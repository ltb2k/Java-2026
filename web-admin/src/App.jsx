import React, { useState } from "react";
import {
  Activity, Bell, Camera, CheckCircle2, CircleGauge, Cloud,
  Droplets, Fan, FileDown, Gauge, Leaf, Lightbulb, Menu,
  Power, Settings, Sprout, Thermometer, Wind, X
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";

const chartData = [
  { time:"00:00", humidity:86, temp:24.2 },
  { time:"03:00", humidity:88, temp:24.0 },
  { time:"06:00", humidity:92, temp:24.8 },
  { time:"09:00", humidity:90, temp:26.5 },
  { time:"12:00", humidity:87, temp:27.2 },
  { time:"15:00", humidity:89, temp:26.8 },
  { time:"18:00", humidity:91, temp:25.5 },
  { time:"21:00", humidity:89.2, temp:25.8 }
];

function SensorCard({icon: Icon, title, value, unit, note, cls}) {
  return (
    <div className={`sensor-card ${cls}`}>
      <div className="sensor-title"><span>{title}</span><Icon size={20}/></div>
      <div className="sensor-value">{value}<small>{unit}</small></div>
      <div className="sensor-note">{note}</div>
    </div>
  );
}

function Device({icon: Icon, title, note, initial=false}) {
  const [on, setOn] = useState(initial);
  return (
    <div className="device">
      <div className="device-icon"><Icon size={19}/></div>
      <div className="device-info"><b>{title}</b><span>{note}</span></div>
      <button className={on ? "switch on" : "switch"} onClick={() => setOn(!on)}>
        <span></span>{on ? "BẬT" : "TẮT"}
      </button>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("AUTO");
  const [sidebar, setSidebar] = useState(true);

  return (
    <div className="app">
      <aside className={sidebar ? "sidebar" : "sidebar collapsed"}>
        <div className="brand"><div className="brand-logo"><Sprout size={22}/></div>{sidebar && <div><b>MUSHROOM</b><span>SMART FARM</span></div>}</div>
        <nav>
          <a className="active"><CircleGauge size={19}/> {sidebar && "Dashboard"}</a>
          <a><Leaf size={19}/> {sidebar && "Khay nuôi trồng"}</a>
          <a><Cloud size={19}/> {sidebar && "Phòng trồng"}</a>
          <a><Activity size={19}/> {sidebar && "Dữ liệu cảm biến"}</a>
          <a><Camera size={19}/> {sidebar && "Camera"}</a>
          <a><Bell size={19}/> {sidebar && "Thông báo"}</a>
          <a><Settings size={19}/> {sidebar && "Cài đặt"}</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="operator"><div className="avatar">OP</div>{sidebar && <div><b>Farm Operator</b><span>Đang hoạt động</span></div>}</div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <button className="icon-btn" onClick={() => setSidebar(!sidebar)}><Menu size={21}/></button>
          <div><h1>Nhà Trồng Nấm Thông Minh</h1><p>Trang điều hành trung tâm & giám sát từ xa</p></div>
          <div className="header-actions">
            <div className="online"><span></span> ESP32 Online</div>
            <button className="export"><FileDown size={17}/> Xuất báo cáo</button>
            <button className="icon-btn"><Bell size={19}/></button>
          </div>
        </header>

        <section className="rental">
          <div><span>Mã định danh khay</span><b>TRAY-A101</b><small>Phòng 01 · Kệ 03</small></div>
          <div><span>Giống nấm</span><b>Nấm Bào Ngư Xám</b><small>Pleurotus</small></div>
          <div><span>Khách hàng thuê</span><b>Trần Văn B</b><small>Gói 30 ngày</small></div>
          <div><span>Chu kỳ sinh trưởng</span><b className="cyan">Ngày 14 / 30</b><small>Giai đoạn ra quả thể</small></div>
        </section>

        <section className="sensors">
          <SensorCard icon={Thermometer} title="Nhiệt độ" value="25.8" unit="°C" note="Ngưỡng: 24.0 – 28.0 °C" cls="temp"/>
          <SensorCard icon={Droplets} title="Độ ẩm" value="89.2" unit="%" note="Ngưỡng: 85.0 – 95.0 %" cls="hum"/>
          <SensorCard icon={Wind} title="CO₂" value="640" unit="ppm" note="Mức tối đa: < 800 ppm" cls="co2"/>
          <SensorCard icon={Lightbulb} title="Ánh sáng" value="420" unit="Lux" note="Chiếu sáng: 8 giờ/ngày" cls="lux"/>
        </section>

        <section className="grid-main">
          <div className="panel camera-panel">
            <div className="panel-head">
              <div><h2>Camera trực tuyến</h2><span>TRAY-A101 · RTSP / HLS</span></div>
              <div className="head-buttons"><button>📸 Chụp ảnh</button><button>⏱ Time-lapse</button></div>
            </div>
            <div className="camera">
              <div className="live"><b>● TRỰC TIẾP</b><span>1080P · 30 FPS</span></div>
              <div className="mushroom-visual"><Sprout size={90}/><div>CAMERA FEED</div><small>WebRTC / HLS stream</small></div>
              <div className="ai-box"><b>Mushroom · 8.5 cm</b><span>Độ chín: 85%</span></div>
            </div>
          </div>

          <div className="panel control">
            <div className="panel-head"><div><h2>Điều khiển vi khí hậu</h2><span>ESP32 · Relay Controller</span></div><Power size={19}/></div>
            <div className="mode"><button className={mode==="AUTO" ? "selected":""} onClick={()=>setMode("AUTO")}>Tự động</button><button className={mode==="MANUAL" ? "selected":""} onClick={()=>setMode("MANUAL")}>Thủ công</button></div>
            <div className="mode-info"><Gauge size={16}/> Chế độ {mode === "AUTO" ? "tự động theo cảm biến" : "điều khiển thủ công"}</div>
            <Device icon={Droplets} title="Máy phun sương" note="Tự ngắt khi độ ẩm > 92%" initial/>
            <Device icon={Fan} title="Quạt thông gió" note="Tự bật khi CO₂ > 750 ppm"/>
            <Device icon={Lightbulb} title="Đèn LED tán xạ" note="06:00 – 14:00 hàng ngày" initial/>
            <button className="harvest"><CheckCircle2 size={18}/> Xác nhận thu hoạch & tạo đơn</button>
          </div>
        </section>

        <section className="grid-bottom">
          <div className="panel chart-panel">
            <div className="panel-head"><div><h2>Biểu đồ môi trường</h2><span>24 giờ qua · cập nhật mỗi 5 giây</span></div><Activity size={19}/></div>
            <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}>
              <CartesianGrid stroke="#23314f" strokeDasharray="3 3"/>
              <XAxis dataKey="time" stroke="#71809b" />
              <YAxis yAxisId="left" stroke="#38bdf8" domain={[70,100]}/>
              <YAxis yAxisId="right" orientation="right" stroke="#f87171" domain={[20,35]}/>
              <Tooltip contentStyle={{background:"#101a31",border:"1px solid #2a3a5c",borderRadius:8}}/>
              <Legend/>
              <Line yAxisId="left" type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#38bdf8" strokeWidth={3} dot={false}/>
              <Line yAxisId="right" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#f87171" strokeWidth={3} dot={false}/>
            </LineChart></ResponsiveContainer></div>
          </div>

          <div className="panel logs">
            <div className="panel-head"><div><h2>Nhật ký tác vụ</h2><span>Hoạt động gần nhất</span></div><Activity size={19}/></div>
            <div className="log"><time>13:05:12 · Hệ thống</time><b>Độ ẩm 89.2% → Tắt van phun sương</b></div>
            <div className="log warning"><time>12:45:00 · Cảnh báo</time><b>CO₂ 710 ppm → Quạt thông gió kích hoạt</b></div>
            <div className="log"><time>10:00:15 · Khách hàng</time><b>Truy cập Live Camera xem khay nấm</b></div>
            <div className="log"><time>06:00:00 · Hẹn giờ</time><b>Bật đèn LED sinh học</b></div>
          </div>
        </section>
      </main>
    </div>
  );
}