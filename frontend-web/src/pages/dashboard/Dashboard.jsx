import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

function StatCard({ title, value, description, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}

const SEVERITY_BADGE = {
  DANGER: 'bg-red-100 text-red-700',
  WARNING: 'bg-amber-100 text-amber-700',
  INFO: 'bg-blue-100 text-blue-700',
};

export default function Dashboard({
  rooms = [],
  devices = [],
  alerts = [],
  onRefresh,
}) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [sumRes, histRes] = await Promise.all([
        api.dashboard.summary(),
        api.sensors.history({
          room_id: selectedRoomId || undefined,
          limit: 30,
        }),
      ]);
      setSummary(sumRes);
      setHistory(Array.isArray(histRes) ? histRes : []);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải dữ liệu Dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleToggleDevice = async (device) => {
    if (device.status === 'OFFLINE') return;
    setBusyId(`dev-${device.id}`);
    setErrorMsg('');
    setActionMsg('');
    try {
      const action = device.is_on ? 'TURN_OFF' : 'TURN_ON';
      await api.devices.sendCommand(device.id, action, { source: 'web-dashboard' });
      setActionMsg(`Đã gửi lệnh ${action} đến thiết bị "${device.name}".`);
      if (onRefresh) await onRefresh();
      await loadDashboard();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể điều khiển thiết bị.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkRead = async (alertId) => {
    setBusyId(`read-${alertId}`);
    try {
      await api.alerts.markRead(alertId);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleResolveAlert = async (alertId) => {
    setBusyId(`res-${alertId}`);
    try {
      await api.alerts.resolve(alertId);
      setActionMsg(`Đã xử lý cảnh báo #${alertId}.`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const tempReadings = useMemo(
    () => history.filter((h) => h.sensor_type === 'TEMPERATURE').slice(0, 12).reverse(),
    [history]
  );
  const humReadings = useMemo(
    () => history.filter((h) => h.sensor_type === 'HUMIDITY').slice(0, 12).reverse(),
    [history]
  );

  const env = summary?.environment;

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {errorMsg}
        </div>
      )}
      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Thống kê tổng quan từ API */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tổng quan hệ thống (Dữ liệu thực từ PostgreSQL)
          </h2>
          {loading && <span className="text-xs text-blue-600">Đang tải...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Phòng trồng"
            value={`${summary?.rooms?.active ?? 0} / ${summary?.rooms?.total ?? rooms.length}`}
            description="Phòng đang hoạt động / Tổng số phòng"
            color="text-gray-800"
          />
          <StatCard
            title="Khay nấm"
            value={`${summary?.trays?.rented ?? 0} / ${summary?.trays?.total ?? 0}`}
            description={`Khả dụng: ${summary?.trays?.available ?? 0} khay`}
            color="text-emerald-600"
          />
          <StatCard
            title="Thiết bị đang bật"
            value={`${summary?.devices?.on ?? 0} / ${summary?.devices?.total ?? devices.length}`}
            description="Thiết bị IoT trạng thái ON"
            color="text-blue-600"
          />
          <StatCard
            title="Cảnh báo chưa đọc"
            value={summary?.unread_alerts ?? 0}
            description={`Hợp đồng đang thuê: ${summary?.rentals?.active ?? 0} | Chờ duyệt: ${summary?.rentals?.pending ?? 0}`}
            color={(summary?.unread_alerts ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}
          />
        </div>
      </section>

      {/* Thông số môi trường mới nhất */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Thông số môi trường mới nhất
            </h3>
            <p className="text-xs text-gray-500">
              Cập nhật lần cuối:{' '}
              {env?.last_updated
                ? new Date(env.last_updated).toLocaleString('vi-VN')
                : 'Chưa có dữ liệu'}
            </p>
          </div>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">Tất cả phòng (Lịch sử)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="rounded-lg bg-orange-50 border border-orange-100 p-4">
            <p className="text-xs text-orange-700 font-medium">Nhiệt độ</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {env?.temperature?.value != null ? `${env.temperature.value} ${env.temperature.unit || '°C'}` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-100 p-4">
            <p className="text-xs text-sky-700 font-medium">Độ ẩm không khí</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">
              {env?.humidity?.value != null ? `${env.humidity.value} ${env.humidity.unit || '%'}` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 border border-purple-100 p-4">
            <p className="text-xs text-purple-700 font-medium">Nồng độ CO₂</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {env?.co2?.value != null ? `${env.co2.value} ${env.co2.unit || 'ppm'}` : '—'}
            </p>
          </div>
        </div>

        {/* Biểu đồ lịch sử nhiệt độ & độ ẩm */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Lịch sử Nhiệt độ (°C) — 12 mẫu gần nhất
            </p>
            {tempReadings.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Chưa có dữ liệu cảm biến nhiệt độ.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-28 pt-2">
                {tempReadings.map((r) => {
                  const pct = Math.min(100, Math.max(15, (Number(r.value) / 45) * 100));
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] text-gray-600 mb-1">{r.value}</span>
                      <div
                        className="w-full bg-orange-400 rounded-t"
                        style={{ height: `${pct}%` }}
                        title={`${r.value}°C - ${new Date(r.recorded_at).toLocaleTimeString('vi-VN')}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border border-gray-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Lịch sử Độ ẩm (%) — 12 mẫu gần nhất
            </p>
            {humReadings.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">Chưa có dữ liệu cảm biến độ ẩm.</p>
            ) : (
              <div className="flex items-end gap-1.5 h-28 pt-2">
                {humReadings.map((r) => {
                  const pct = Math.min(100, Math.max(15, Number(r.value)));
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] text-gray-600 mb-1">{r.value}</span>
                      <div
                        className="w-full bg-sky-500 rounded-t"
                        style={{ height: `${pct}%` }}
                        title={`${r.value}% - ${new Date(r.recorded_at).toLocaleTimeString('vi-VN')}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Điều khiển nhanh thiết bị & Cảnh báo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            Điều khiển nhanh thiết bị IoT
          </h3>
          {devices.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Chưa có thiết bị nào trong cơ sở dữ liệu.</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {devices.map((dev) => (
                <div key={dev.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{dev.name}</p>
                    <p className="text-xs text-gray-500">
                      {dev.device_type} • {dev.room_name || `Phòng #${dev.room_id}`} •{' '}
                      <span className={dev.status === 'ONLINE' ? 'text-emerald-600' : 'text-slate-400'}>
                        {dev.status}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={dev.status === 'OFFLINE' || busyId === `dev-${dev.id}`}
                    onClick={() => handleToggleDevice(dev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
                      dev.is_on
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {busyId === `dev-${dev.id}`
                      ? 'Đang gửi...'
                      : dev.is_on
                      ? 'Đang BẬT (Tắt)'
                      : 'Đang TẮT (Bật)'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            Cảnh báo & Thông báo môi trường ({alerts.length})
          </h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Không có cảnh báo môi trường.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className={`rounded-lg border p-3 ${
                    al.is_read ? 'bg-gray-50 border-gray-200' : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            SEVERITY_BADGE[al.severity] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {al.severity}
                        </span>
                        <span className="text-xs font-semibold text-gray-800">{al.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{al.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {al.room_name || 'Hệ thống'} • {al.status} •{' '}
                        {al.created_at ? new Date(al.created_at).toLocaleString('vi-VN') : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!al.is_read && (
                        <button
                          type="button"
                          disabled={busyId === `read-${al.id}`}
                          onClick={() => handleMarkRead(al.id)}
                          className="text-[11px] px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer"
                        >
                          Đã đọc
                        </button>
                      )}
                      {al.status === 'ACTIVE' && (
                        <button
                          type="button"
                          disabled={busyId === `res-${al.id}`}
                          onClick={() => handleResolveAlert(al.id)}
                          className="text-[11px] px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Xử lý
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
