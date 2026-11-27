import React, { useMemo, useState } from 'react';
import api from '../../services/api';

const STATUS_BADGE = {
  ONLINE: 'bg-emerald-100 text-emerald-700',
  OFFLINE: 'bg-slate-200 text-slate-600',
  ERROR: 'bg-red-100 text-red-700',
};

export default function Devices({ rooms = [], devices = [], onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    device_type: 'FAN',
    room_id: rooms[0]?.id ?? '',
    status: 'ONLINE',
    is_on: false,
  });

  const [commandHistory, setCommandHistory] = useState(null);

  const stats = useMemo(() => {
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === 'ONLINE').length,
      offline: devices.filter((d) => d.status === 'OFFLINE').length,
      active: devices.filter((d) => d.is_on).length,
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return devices.filter((d) => {
      const matchSearch =
        !kw ||
        String(d.name || '').toLowerCase().includes(kw) ||
        String(d.device_type || '').toLowerCase().includes(kw);
      const matchRoom =
        selectedRoom === 'ALL' || Number(d.room_id) === Number(selectedRoom);
      const matchStatus =
        selectedStatus === 'ALL' || d.status === selectedStatus;
      return matchSearch && matchRoom && matchStatus;
    });
  }, [devices, searchTerm, selectedRoom, selectedStatus]);

  const handleTogglePower = async (dev) => {
    if (dev.status === 'OFFLINE') return;
    setBusyId(`cmd-${dev.id}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const action = dev.is_on ? 'TURN_OFF' : 'TURN_ON';
      await api.devices.sendCommand(dev.id, action, { source: 'web-devices' });
      setSuccessMsg(`Đã gửi lệnh ${action} đến thiết bị "${dev.name}".`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    setBusyId('save');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: formData.name.trim(),
        device_type: formData.device_type.trim(),
        room_id: formData.room_id ? Number(formData.room_id) : null,
        status: formData.status,
        is_on: Boolean(formData.is_on),
      };
      if (editingDevice) {
        await api.devices.update(editingDevice.id, payload);
        setSuccessMsg(`Đã cập nhật thiết bị "${payload.name}".`);
      } else {
        await api.devices.create(payload);
        setSuccessMsg(`Đã thêm thiết bị "${payload.name}".`);
      }
      setIsModalOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (dev) => {
    if (!window.confirm(`Xóa thiết bị "${dev.name}"?`)) return;
    setBusyId(`del-${dev.id}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.devices.remove(dev.id);
      setSuccessMsg(`Đã xóa thiết bị "${dev.name}".`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleViewCommands = async (dev) => {
    try {
      const logs = await api.devices.commands(dev.id);
      setCommandHistory({ device: dev, logs: logs || [] });
    } catch (err) {
      setErrorMsg(err.message);
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tổng thiết bị</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Đang Online</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.online}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Offline</p>
          <p className="text-2xl font-bold text-slate-500 mt-1">{stats.offline}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Đang bật (ON)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.active}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Tìm tên, loại thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs"
            />
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
            >
              <option value="ALL">Tất cả phòng</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingDevice(null);
              setFormData({
                name: '',
                device_type: 'FAN',
                room_id: rooms[0]?.id ?? '',
                status: 'ONLINE',
                is_on: false,
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            + Thêm thiết bị
          </button>
        </div>

        {filteredDevices.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Chưa có thiết bị phù hợp.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Tên thiết bị</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Phòng</th>
                  <th className="px-4 py-3">Kết nối</th>
                  <th className="px-4 py-3">Điều khiển</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDevices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{dev.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{dev.name}</td>
                    <td className="px-4 py-3 text-gray-600">{dev.device_type}</td>
                    <td className="px-4 py-3 text-gray-600">{dev.room_name || `#${dev.room_id}`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[dev.status] || 'bg-gray-100'}`}>
                        {dev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={dev.status === 'OFFLINE' || busyId === `cmd-${dev.id}`}
                        onClick={() => handleTogglePower(dev)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                          dev.is_on
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {busyId === `cmd-${dev.id}` ? '...' : dev.is_on ? 'ON' : 'OFF'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewCommands(dev)}
                        className="text-xs text-slate-600 hover:underline cursor-pointer"
                      >
                        Lệnh
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDevice(dev);
                          setFormData({
                            name: dev.name || '',
                            device_type: dev.device_type || 'FAN',
                            room_id: dev.room_id ?? '',
                            status: dev.status || 'ONLINE',
                            is_on: Boolean(dev.is_on),
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={busyId === `del-${dev.id}`}
                        onClick={() => handleDelete(dev)}
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveDevice}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-800">
              {editingDevice ? 'Cập nhật thiết bị' : 'Thêm thiết bị IoT mới'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tên thiết bị</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Loại thiết bị</label>
                <input
                  type="text"
                  value={formData.device_type}
                  onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  placeholder="FAN / MIST / LED / SENSOR"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phòng trồng</label>
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_on}
                    onChange={(e) => setFormData({ ...formData, is_on: e.target.checked })}
                  />
                  Đang bật (ON)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busyId === 'save'}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                {busyId === 'save' ? 'Đang lưu...' : 'Lưu thiết bị'}
              </button>
            </div>
          </form>
        </div>
      )}

      {commandHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">
                Lịch sử lệnh MQTT — {commandHistory.device.name}
              </h3>
              <button
                type="button"
                onClick={() => setCommandHistory(null)}
                className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>
            {commandHistory.logs.length === 0 ? (
              <p className="text-xs text-gray-500 py-4">Chưa có lệnh nào được gửi đến thiết bị này.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 text-xs">
                {commandHistory.logs.map((cmd) => (
                  <div key={cmd.id} className="py-2 flex justify-between">
                    <div>
                      <span className="font-semibold text-gray-800">{cmd.action}</span>{' '}
                      <span className="text-gray-500">({cmd.status})</span>
                    </div>
                    <span className="text-gray-400">
                      {cmd.created_at ? new Date(cmd.created_at).toLocaleString('vi-VN') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
