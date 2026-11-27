import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

const formatCurrency = (amount) =>
  `${Number(amount || 0).toLocaleString('vi-VN')} đ`;

export default function CustomerPortal({ currentUser, onLogout }) {
  const [packages, setPackages] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [trays, setTrays] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [env, setEnv] = useState(null);

  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [linkCode, setLinkCode] = useState('');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [pkgList, rentalList, trayList, alertList, envStats] = await Promise.all([
        api.packages.list({ status: 'ACTIVE' }),
        api.rentals.list(),
        api.trays.list(),
        api.alerts.list({ limit: 20 }),
        api.sensors.latest(),
      ]);
      const pkgs = Array.isArray(pkgList) ? pkgList : [];
      setPackages(pkgs);
      if (pkgs.length > 0 && !selectedPackageId) {
        setSelectedPackageId(String(pkgs[0].id));
      }
      setRentals(Array.isArray(rentalList) ? rentalList : []);
      setTrays(Array.isArray(trayList) ? trayList : []);
      setAlerts(Array.isArray(alertList) ? alertList : []);
      setEnv(envStats || null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPackageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitRental = async (e) => {
    e.preventDefault();
    if (!selectedPackageId) return;
    setBusy(true);
    setErrorMsg('');
    setFeedback('');
    try {
      const created = await api.rentals.create({
        package_id: Number(selectedPackageId),
        quantity: Number(quantity) || 1,
        notes: notes.trim() || null,
      });
      setNotes('');
      setFeedback(`Đã gửi yêu cầu thuê #${created.id}. Vận hành sẽ duyệt và phân bổ khay sớm nhất.`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLinkTray = async (e) => {
    e.preventDefault();
    if (!linkCode.trim()) return;
    setBusy(true);
    setErrorMsg('');
    setFeedback('');
    try {
      await api.rentals.link(linkCode.trim());
      setLinkCode('');
      setFeedback('Liên kết khay thành công! Hợp đồng đã kích hoạt.');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍄</span>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              MUSHROOM IOT — Cổng Khách thuê
            </h1>
            <p className="text-xs text-gray-500">
              Xin chào <strong>{currentUser?.full_name || currentUser?.name}</strong> • Vai trò:{' '}
              <span className="font-semibold text-emerald-700">Customer</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}
        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
            {feedback}
          </div>
        )}

        {/* Môi trường hiện tại */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Nhiệt độ phòng</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {env?.temperature?.value != null ? `${env.temperature.value} °C` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Độ ẩm không khí</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">
              {env?.humidity?.value != null ? `${env.humidity.value} %` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Nồng độ CO₂</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {env?.co2?.value != null ? `${env.co2.value} ppm` : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Đăng ký thuê gói mới */}
          <form onSubmit={handleSubmitRental} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Đăng ký thuê khay nấm</h2>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Chọn gói thuê</label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)} ({p.duration_days} ngày)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Số lượng khay (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú cho nhân viên vận hành..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy || packages.length === 0}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Gửi yêu cầu thuê
            </button>
          </form>

          {/* Liên kết khay bằng mã code */}
          <form onSubmit={handleLinkTray} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Liên kết khay bằng mã (Link Code)</h2>
            <p className="text-xs text-gray-500">
              Sau khi yêu cầu được duyệt, nhập mã liên kết được cấp để kích hoạt theo dõi khay.
            </p>
            <input
              type="text"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value)}
              placeholder="Nhập mã liên kết (VD: LNK-XXXXXX)"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !linkCode.trim()}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Kích hoạt liên kết khay
            </button>
          </form>
        </div>

        {/* Khay đang thuê */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Khay nấm của tôi ({trays.length})
          </h2>
          {loading ? (
            <p className="text-sm text-gray-500">Đang tải...</p>
          ) : trays.length === 0 ? (
            <p className="text-sm text-gray-500">Bạn chưa có khay nấm nào đang kích hoạt.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trays.map((t) => (
                <div key={t.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-800">{t.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {t.growth_stage}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t.mushroom_variety} • {t.room_name} • Ngày {t.growth_day}/{t.growth_total_days}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách hợp đồng */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Lịch sử hợp đồng thuê ({rentals.length})
          </h2>
          {rentals.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có hợp đồng thuê nào.</p>
          ) : (
            <div className="divide-y divide-gray-100 text-sm">
              {rentals.map((r) => (
                <div key={r.id} className="py-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">
                      #{r.id} — {r.package_name} (x{r.quantity})
                    </p>
                    <p className="text-xs text-gray-500">
                      Giá: {formatCurrency(r.package_price)} • Trạng thái: <strong>{r.status}</strong>
                      {r.active_link_code ? ` • Mã liên kết: ${r.active_link_code}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cảnh báo */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              Thông báo môi trường ({alerts.length})
            </h2>
            <div className="space-y-2 text-xs">
              {alerts.map((al) => (
                <div key={al.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="font-semibold text-gray-800">{al.title}</p>
                  <p className="text-gray-600 mt-0.5">{al.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
