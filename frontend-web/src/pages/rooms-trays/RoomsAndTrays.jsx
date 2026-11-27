import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const TRAY_STATUS_BADGE = {
  AVAILABLE: 'bg-slate-100 text-slate-700',
  RENTED: 'bg-emerald-100 text-emerald-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-gray-200 text-gray-600',
};

const STAGE_LABELS = {
  PREPARATION: 'Chuẩn bị phôi',
  INCUBATION: 'Ươm tơ',
  FRUITING: 'Ra quả thể',
  READY_TO_HARVEST: 'Sẵn sàng thu hoạch',
  HARVESTED: 'Đã thu hoạch',
  COMPLETED: 'Hoàn tất chu kỳ',
};

export default function RoomsAndTrays({ rooms = [], onRefresh }) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Room create/edit
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', location: '', status: 'ACTIVE' });
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({ name: '', location: '', status: 'ACTIVE' });

  // Tray create/edit
  const [isAddingTray, setIsAddingTray] = useState(false);
  const [trayForm, setTrayForm] = useState({
    code: '',
    mushroom_variety: 'Nấm Bào Ngư',
    growth_total_days: 30,
  });
  const [isEditingTray, setIsEditingTray] = useState(false);
  const [editTrayForm, setEditTrayForm] = useState({
    id: null,
    code: '',
    mushroom_variety: '',
    status: 'AVAILABLE',
    growth_day: 0,
    growth_total_days: 30,
  });

  useEffect(() => {
    if (rooms.length === 0) {
      setSelectedRoomId(null);
      return;
    }
    if (!rooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || null;
  const selectedTray =
    currentRoom?.trays?.find((t) => t.id === selectedTrayId) || null;

  const statistics = useMemo(() => {
    const allTrays = rooms.flatMap((r) => r.trays || []);
    return {
      total: allTrays.length,
      rented: allTrays.filter((t) => t.status === 'RENTED').length,
      ready: allTrays.filter((t) => t.growth_stage === 'READY_TO_HARVEST').length,
      available: allTrays.filter((t) => t.status === 'AVAILABLE').length,
    };
  }, [rooms]);

  const filteredTrays = useMemo(() => {
    if (!currentRoom?.trays) return [];
    const kw = searchTerm.trim().toLowerCase();
    return currentRoom.trays.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchKw =
        !kw ||
        String(t.code || '').toLowerCase().includes(kw) ||
        String(t.mushroom_variety || '').toLowerCase().includes(kw) ||
        String(t.customer_name || '').toLowerCase().includes(kw);
      return matchStatus && matchKw;
    });
  }, [currentRoom, statusFilter, searchTerm]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const created = await api.rooms.create({
        name: roomForm.name.trim(),
        location: roomForm.location.trim() || null,
        status: roomForm.status,
      });
      setIsAddingRoom(false);
      setRoomForm({ name: '', location: '', status: 'ACTIVE' });
      setSuccessMsg(`Đã tạo phòng "${created.name}".`);
      if (onRefresh) await onRefresh();
      setSelectedRoomId(created.id);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!currentRoom) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.rooms.update(currentRoom.id, {
        name: editRoomForm.name.trim(),
        location: editRoomForm.location.trim() || null,
        status: editRoomForm.status,
      });
      setIsEditingRoom(false);
      setSuccessMsg(`Đã cập nhật phòng "${editRoomForm.name}".`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Xóa hoặc lưu trữ phòng "${room.name}"?`)) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.rooms.remove(room.id);
      setSuccessMsg(res?.message || `Đã xử lý phòng "${room.name}".`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateTray = async (e) => {
    e.preventDefault();
    if (!currentRoom || !trayForm.code.trim()) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.trays.create({
        code: trayForm.code.trim().toUpperCase(),
        room_id: currentRoom.id,
        mushroom_variety: trayForm.mushroom_variety.trim() || null,
        growth_total_days: Number(trayForm.growth_total_days) || 30,
        status: 'AVAILABLE',
      });
      setIsAddingTray(false);
      setTrayForm({ code: '', mushroom_variety: 'Nấm Bào Ngư', growth_total_days: 30 });
      setSuccessMsg(`Đã thêm khay mới vào ${currentRoom.name}.`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateTray = async (e) => {
    e.preventDefault();
    if (!editTrayForm.id) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.trays.update(editTrayForm.id, {
        code: editTrayForm.code.trim(),
        room_id: currentRoom?.id,
        mushroom_variety: editTrayForm.mushroom_variety.trim() || null,
        status: editTrayForm.status,
        growth_day: Number(editTrayForm.growth_day) || 0,
        growth_total_days: Number(editTrayForm.growth_total_days) || 30,
      });
      setIsEditingTray(false);
      setSuccessMsg(`Đã cập nhật khay ${editTrayForm.code}.`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTray = async (tray) => {
    if (!window.confirm(`Xóa hoặc lưu trữ khay "${tray.code}"?`)) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.trays.remove(tray.id);
      setSelectedTrayId(null);
      setSuccessMsg(res?.message || `Đã xử lý khay ${tray.code}.`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          {successMsg}
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tổng số phòng</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{rooms.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tổng số khay</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{statistics.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Khay đang thuê</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{statistics.rented}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Khay khả dụng</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statistics.available}</p>
        </div>
      </div>

      {/* Chọn phòng & CRUD phòng */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-800">Danh sách Phòng trồng</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddingRoom((v) => !v)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
            >
              + Thêm phòng
            </button>
            {currentRoom && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditRoomForm({
                      name: currentRoom.name || '',
                      location: currentRoom.location || '',
                      status: currentRoom.status || 'ACTIVE',
                    });
                    setIsEditingRoom(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Sửa phòng
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDeleteRoom(currentRoom)}
                  className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium cursor-pointer"
                >
                  Xóa phòng
                </button>
              </>
            )}
          </div>
        </div>

        {isAddingRoom && (
          <form onSubmit={handleCreateRoom} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Tên phòng (VD: Phòng Nấm C1)"
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              required
            />
            <input
              type="text"
              placeholder="Vị trí (VD: Khu C)"
              value={roomForm.location}
              onChange={(e) => setRoomForm({ ...roomForm, location: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            />
            <select
              value={roomForm.status}
              onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                Lưu phòng
              </button>
              <button
                type="button"
                onClick={() => setIsAddingRoom(false)}
                className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {isEditingRoom && currentRoom && (
          <form onSubmit={handleUpdateRoom} className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={editRoomForm.name}
              onChange={(e) => setEditRoomForm({ ...editRoomForm, name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              required
            />
            <input
              type="text"
              value={editRoomForm.location}
              onChange={(e) => setEditRoomForm({ ...editRoomForm, location: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            />
            <select
              value={editRoomForm.status}
              onChange={(e) => setEditRoomForm({ ...editRoomForm, status: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
              >
                Cập nhật
              </button>
              <button
                type="button"
                onClick={() => setIsEditingRoom(false)}
                className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {rooms.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Chưa có phòng trồng nào trong cơ sở dữ liệu.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setSelectedTrayId(null);
                }}
                className={`text-left p-4 rounded-xl border transition cursor-pointer ${
                  room.id === selectedRoomId
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-800">{room.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {room.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vị trí: {room.location || 'Chưa cập nhật'} • Khay: {room.trays?.length || 0} • Thiết bị: {room.total_devices ?? 0}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Danh sách khay của phòng đang chọn */}
      {currentRoom && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Khay trồng thuộc {currentRoom.name} ({filteredTrays.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Tìm mã khay, giống nấm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RENTED">RENTED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
              <button
                type="button"
                onClick={() => setIsAddingTray((v) => !v)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
              >
                + Thêm khay
              </button>
            </div>
          </div>

          {isAddingTray && (
            <form onSubmit={handleCreateTray} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Mã khay (VD: TRAY-C01)"
                value={trayForm.code}
                onChange={(e) => setTrayForm({ ...trayForm, code: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                required
              />
              <input
                type="text"
                placeholder="Loại nấm"
                value={trayForm.mushroom_variety}
                onChange={(e) => setTrayForm({ ...trayForm, mushroom_variety: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              />
              <input
                type="number"
                min="1"
                placeholder="Tổng ngày chu kỳ"
                value={trayForm.growth_total_days}
                onChange={(e) => setTrayForm({ ...trayForm, growth_total_days: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Tạo khay
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTray(false)}
                  className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {filteredTrays.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              Không có khay nào phù hợp bộ lọc.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Mã khay</th>
                    <th className="px-4 py-3">Loại nấm</th>
                    <th className="px-4 py-3">Giai đoạn</th>
                    <th className="px-4 py-3">Ngày tuổi</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Khách thuê</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTrays.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTrayId(t.id)}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedTrayId === t.id ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">{t.code}</td>
                      <td className="px-4 py-3 text-gray-600">{t.mushroom_variety || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {STAGE_LABELS[t.growth_stage] || t.growth_stage}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {t.growth_day ?? 0} / {t.growth_total_days ?? 30} ngày
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            TRAY_STATUS_BADGE[t.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditTrayForm({
                              id: t.id,
                              code: t.code || '',
                              mushroom_variety: t.mushroom_variety || '',
                              status: t.status || 'AVAILABLE',
                              growth_day: t.growth_day ?? 0,
                              growth_total_days: t.growth_total_days ?? 30,
                            });
                            setIsEditingTray(true);
                          }}
                          className="text-xs text-blue-600 hover:underline cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDeleteTray(t)}
                          className="text-xs text-red-600 hover:underline cursor-pointer"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isEditingTray && (
            <form onSubmit={handleUpdateTray} className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 grid grid-cols-1 md:grid-cols-6 gap-3">
              <input
                type="text"
                value={editTrayForm.code}
                onChange={(e) => setEditTrayForm({ ...editTrayForm, code: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                required
              />
              <input
                type="text"
                value={editTrayForm.mushroom_variety}
                onChange={(e) => setEditTrayForm({ ...editTrayForm, mushroom_variety: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                placeholder="Loại nấm"
              />
              <select
                value={editTrayForm.status}
                onChange={(e) => setEditTrayForm({ ...editTrayForm, status: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="RENTED">RENTED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
              <input
                type="number"
                value={editTrayForm.growth_day}
                onChange={(e) => setEditTrayForm({ ...editTrayForm, growth_day: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                placeholder="Ngày hiện tại"
              />
              <input
                type="number"
                value={editTrayForm.growth_total_days}
                onChange={(e) => setEditTrayForm({ ...editTrayForm, growth_total_days: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
                placeholder="Tổng ngày"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="flex-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer">
                  Lưu
                </button>
                <button type="button" onClick={() => setIsEditingTray(false)} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 text-xs cursor-pointer">
                  Hủy
                </button>
              </div>
            </form>
          )}

          {selectedTray && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-wrap justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-slate-900">{selectedTray.code}</span> •{' '}
                <span>{selectedTray.mushroom_variety || 'Chưa gán giống nấm'}</span>
              </div>
              <div>
                Giai đoạn: <strong>{STAGE_LABELS[selectedTray.growth_stage] || selectedTray.growth_stage}</strong> •{' '}
                Hợp đồng: <strong>{selectedTray.rental_id ? `#${selectedTray.rental_id} (${selectedTray.rental_status})` : 'Chưa thuê'}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
