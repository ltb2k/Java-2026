import React, { useEffect, useState } from "react";
import {
  Activity, Bell, Camera, CheckCircle2, CircleGauge, Cloud,
  Droplets, Fan, FileDown, Lightbulb, Menu, Power, Settings,
  Sprout, Thermometer, Wind, LogOut
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import { dashboard, sensorHistory, login, devices, toggleDevice } from "./api";

const fallback = [
  {time:"00:00", humidity:86, temp:24.2},
  {time:"03:00", humidity:88, temp:24},
  {time:"06:00", humidity:92, temp:24.8},
  {time:"09:00", humidity:90, temp:26.5},
  {time:"12:00", humidity:87, temp:27.2},
  {time:"15:00", humidity:89, temp:26.8},
  {time:"18:00", humidity:91, temp:25.5},
  {time:"21:00", humidity:89.2, temp:25.8}
];

function Login({onLogin}) {
  const [email,setEmail]=useState("admin@mushroom.local");
  const [password,setPassword]=useState("Admin@123");
  const [error,setError]=useState("");
  const submit=async(e)=>{
    e.preventDefault(); setError("");
    try { const d=await login(email,password); localStorage.setItem("token",d.token); onLogin(d.user); }
    catch(e){setError(e.message);}
  };
  return <div className="login"><form onSubmit={submit} className="login-card">
    <div className="logo"><Sprout/></div><h1>MUSHROOM</h1><p>SMART FARM ADMIN</p>
    <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
    <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Mật khẩu"/>
    {error&&<div className="error">{error}</div>}
    <button>Đăng nhập</button>
    <small>Demo admin: admin@mushroom.local / Admin@123</small>
  </form></div>;
}

function Sensor({Icon,title,value,unit,note,cls}) {
  return <div className={"sensor "+cls}><div className="st"><span>{title}</span><Icon size={20}/></div>
    <div className="sv">{value}<small>{unit}</small></div><div className="sn">{note}</div>
  </div>;
}

export default function App(){
  const [user,setUser]=useState(null);
  const [sidebar,setSidebar]=useState(true);
  const [mode,setMode]=useState("AUTO");
  const [data,setData]=useState(null);
  const [chart,setChart]=useState(fallback);
  const [deviceList,setDeviceList]=useState([]);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!localStorage.getItem("token")) return;
    Promise.all([dashboard(),sensorHistory(),devices()])
      .then(([d,h,dev])=>{
        setData(d); setDeviceList(dev);
        const by={};
        h.forEach(x=>{
          const k=new Date(x.recorded_at).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});
          by[k]??={time:k};
          if(x.sensor_type==="HUMIDITY") by[k].humidity=+x.value;
          if(x.sensor_type==="TEMPERATURE") by[k].temp=+x.value;
        });
        if(Object.keys(by).length) setChart(Object.values(by).slice(-24));
      })
      .catch(e=>setError(e.message));
  },[]);

  if(!localStorage.getItem("token") && !user)
    return <Login onLogin={setUser}/>;

  const cur=data?.current||{temperature:25.8,humidity:89.2,co2:640};
  const tray=data?.tray;

  const toggle=async(id)=>{
    try {
      const d=await toggleDevice(id);
      setDeviceList(v=>v.map(x=>x.id===id?d:x));
    } catch(e){setError(e.message);}
  };

  const logout=()=>{localStorage.removeItem("token");setUser(null);location.reload();};

  return <div className="app">
    <aside className={sidebar?"side":"side col"}>
      <div className="brand"><div className="logo"><Sprout/></div>{sidebar&&<div><b>MUSHROOM</b><span>SMART FARM</span></div>}</div>
      <nav>
        <a className="active"><CircleGauge/> {sidebar&&"Dashboard"}</a>
        <a><Sprout/>{sidebar&&"Khay nuôi trồng"}</a><a><Cloud/>{sidebar&&"Phòng trồng"}</a>
        <a><Activity/>{sidebar&&"Dữ liệu cảm biến"}</a><a><Camera/>{sidebar&&"Camera"}</a>
        <a><Bell/>{sidebar&&"Thông báo"}</a><a><Settings/>{sidebar&&"Cài đặt"}</a>
      </nav>
    </aside>
    <main>
      <header><button className="icon" onClick={()=>setSidebar(!sidebar)}><Menu/></button>
        <div><h1>Nhà Trồng Nấm Thông Minh</h1><p>Trang điều hành trung tâm & giám sát từ xa</p></div>
        <div className="actions"><span className="online">● Backend Online</span><button className="export"><FileDown size={16}/> Xuất báo cáo</button><button className="icon" onClick={logout}><LogOut/></button></div>
      </header>
      {error&&<div className="notice">{error}</div>}
      <section className="rental">
        <div><span>Mã định danh khay</span><b>{tray?.code||"TRAY-A101"}</b><small>{tray?.room_name||"Phòng 01 · Kệ 03"}</small></div>
        <div><span>Giống nấm</span><b>{tray?.mushroom_variety||"Nấm Bào Ngư Xám"}</b><small>Pleurotus</small></div>
        <div><span>Khách hàng thuê</span><b>{tray?.customer_name||"Chưa gán"}</b><small>{tray?.package_name||"Gói 30 ngày"}</small></div>
        <div><span>Chu kỳ sinh trưởng</span><b className="cyan">Ngày {tray?.growth_day||14} / {tray?.growth_total_days||30}</b><small>Giai đoạn ra quả thể</small></div>
      </section>
      <section className="sensors">
        <Sensor Icon={Thermometer} title="Nhiệt độ" value={Number(cur.temperature).toFixed(1)} unit="°C" note="Ngưỡng: 24 – 28 °C" cls="temp"/>
        <Sensor Icon={Droplets} title="Độ ẩm" value={Number(cur.humidity).toFixed(1)} unit="%" note="Ngưỡng: 85 – 95 %" cls="hum"/>
        <Sensor Icon={Wind} title="CO₂" value={Math.round(cur.co2)} unit="ppm" note="Mức tối đa: < 800 ppm" cls="co2"/>
        <Sensor Icon={Lightbulb} title="Ánh sáng" value="420" unit="Lux" note="Chiếu sáng: 8 giờ/ngày" cls="lux"/>
      </section>
      <section className="grid">
        <div className="panel"><div className="ph"><div><h2>Camera trực tuyến</h2><span>TRAY-A101 · RTSP / HLS</span></div><Camera/></div>
          <div className="camera"><div className="live">● TRỰC TIẾP · 1080P</div><Sprout size={85}/><span>CAMERA FEED</span><div className="aibox">Mushroom · 8.5 cm<br/><small>Độ chín: 85%</small></div></div>
        </div>
        <div className="panel control"><div className="ph"><div><h2>Điều khiển vi khí hậu</h2><span>ESP32 · Relay Controller</span></div><Power/></div>
          <div className="mode"><button className={mode==="AUTO"?"sel":""} onClick={()=>setMode("AUTO")}>Tự động</button><button className={mode==="MANUAL"?"sel":""} onClick={()=>setMode("MANUAL")}>Thủ công</button></div>
          {deviceList.map(d=><div className="device" key={d.id}><Power size={18}/><div className="di"><b>{d.name}</b><span>{d.device_type}</span></div>
            <button className={d.is_on?"on":"off"} onClick={()=>toggle(d.id)}>{d.is_on?"BẬT":"TẮT"}</button></div>)}
          <button className="harvest"><CheckCircle2 size={17}/> Xác nhận thu hoạch & tạo đơn</button>
        </div>
      </section>
      <section className="grid">
        <div className="panel chartpanel"><div className="ph"><div><h2>Biểu đồ môi trường</h2><span>24 giờ qua</span></div><Activity/></div>
          <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid stroke="#243553" strokeDasharray="3 3"/>
            <XAxis dataKey="time" stroke="#73819a"/><YAxis yAxisId="l" domain={[70,100]} stroke="#38bdf8"/><YAxis yAxisId="r" orientation="right" domain={[20,35]} stroke="#f87171"/>
            <Tooltip/><Legend/><Line yAxisId="l" type="monotone" dataKey="humidity" name="Độ ẩm (%)" stroke="#38bdf8" strokeWidth={3} dot={false}/>
            <Line yAxisId="r" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#f87171" strokeWidth={3} dot={false}/>
          </LineChart></ResponsiveContainer></div>
        </div>
        <div className="panel logs"><div className="ph"><div><h2>Nhật ký hệ thống</h2><span>Hoạt động gần nhất</span></div><Activity/></div>
          <div className="log">Backend · REST API đang hoạt động</div><div className="log">Database · PostgreSQL đã kết nối</div>
          <div className="log">Sensor · Đã tải dữ liệu lịch sử</div><div className="log">Auth · Phiên đăng nhập đang hoạt động</div>
        </div>
      </section>
    </main>
  </div>;
}
