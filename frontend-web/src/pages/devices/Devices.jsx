import React, { useState, useMemo } from "react";

const getNextDeviceId = (deviceList) => {
  const maxNum = deviceList.reduce((max, item) => {
    const match = String(item.id).match(/(\d+)$/);
    const num = match ? Number(match[1]) : 0;
    return num > max ? num : max;
  }, 0);
  return `DEV-${String(maxNum + 1).padStart(2, "0")}`;
};

export default function Devices({ rooms = [], devices = [], setDevices }) {
  const defaultRoomId = rooms[0]?.id ?? 1;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "sensor",
    roomId: defaultRoomId,
    mac: "",
    status: "online",
  });

  // Thống kê
  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => d.status === "online").length;
    const offline = devices.filter((d) => d.status === "offline").length;
    const activeActuators = devices.filter(
      (d) => d.type === "actuator" && d.isOn
    ).length;
    return { total, online, offline, activeActuators };
  }, [devices]);

  // Lọc danh sách
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchSearch =
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.mac.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRoom =
        selectedRoom === "ALL" || Number(device.roomId) === Number(selectedRoom);
      const matchStatus =
        selectedStatus === "ALL" || device.status === selectedStatus;
      return matchSearch && matchRoom && matchStatus;
    });
  }, [devices, searchTerm, selectedRoom, selectedStatus]);

  // Lấy tên phòng từ danh sách rooms của App.jsx
  const getRoomName = (roomId) => {
    const found = rooms.find((r) => Number(r.id) === Number(roomId));
    return found ? `${found.name} (${found.id})` : `Phòng #${roomId}`;
  };

  // Bật / Tắt thiết bị
  const handleTogglePower = (id) => {
    if (!setDevices) return;
    setDevices((prev) =>
      prev.map((dev) => {
        if (dev.id !== id || dev.status === "offline") return dev;
        const nextState = !dev.isOn;
        return {
          ...dev,
          isOn: nextState,
          reading:
            dev.type === "actuator"
              ? nextState
                ? "Đang hoạt động"
                : "Đang tắt"
              : dev.reading,
          lastUpdate: "Vừa xong",
        };
      })
    );
  };

  // Mở modal Thêm / Sửa
  const openAddModal = () => {
    setEditingDevice(null);
    setFormData({
      name: "",
      type: "sensor",
      roomId: rooms[0]?.id ?? 1,
      mac: "",
      status: "online",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      type: device.type,
      roomId: Number(device.roomId),
      mac: device.mac,
      status: device.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveDevice = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mac.trim() || !setDevices) return;

    const normalizedData = {
      ...formData,
      name: formData.name.trim(),
      mac: formData.mac.trim(),
      roomId: Number(formData.roomId),
    };

    if (editingDevice) {
      setDevices((prev) =>
        prev.map((dev) =>
          dev.id === editingDevice.id
            ? {
                ...dev,
                ...normalizedData,
                isOn: normalizedData.status === "online" ? dev.isOn : false,
                lastUpdate: "Vừa cập nhật",
              }
            : dev
        )
      );
    } else {
      const newDevice = {
        id: getNextDeviceId(devices),
        ...normalizedData,
        isOn: normalizedData.status === "online",
        reading:
          normalizedData.status === "offline"
            ? "Mất kết nối"
            : normalizedData.type === "sensor"
            ? "Đang đo..."
            : "Sẵn sàng",
        lastUpdate: "Vừa thêm",
      };
      setDevices((prev) => [newDevice, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteDevice = (id) => {
    if (!setDevices) return;
    if (window.confirm("Bạn có chắc muốn gỡ bỏ thiết bị này khỏi hệ thống?")) {
      setDevices((prev) => prev.filter((dev) => dev.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý thiết bị IoT
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Giám sát trạng thái kết nối ESP32, cảm biến và điều khiển thiết bị từng phòng (dữ liệu mô phỏng)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          + Thêm thiết bị mới
        </button>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Tổng thiết bị</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Đang trực tuyến (Online)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.online}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Mất kết nối (Offline)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.offline}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Thiết bị đang chạy</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.activeActuators}
          </p>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên, mã thiết bị hoặc địa chỉ MAC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={selectedRoom}
          onChange={(e) =>
            setSelectedRoom(
              e.target.value === "ALL" ? "ALL" : Number(e.target.value)
            )
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="ALL">Tất cả phòng nuôi</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} ({room.id})
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Bảng danh sách thiết bị */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
              <th className="py-3 px-4">Mã / Thiết bị</th>
              <th className="py-3 px-4">Phòng lắp đặt</th>
              <th className="py-3 px-4">Loại</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Thông số / Hoạt động</th>
              <th className="py-3 px-4">Điều khiển</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
                  Không tìm thấy thiết bị nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{device.name}</div>
                    <div className="text-xs text-gray-500">
                      {device.id} • MAC: {device.mac}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {getRoomName(device.roomId)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        device.type === "sensor"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {device.type === "sensor" ? "Cảm biến" : "Điều khiển"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        device.status === "online"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          device.status === "online"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                      {device.status === "online" ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">
                      {device.reading}
                    </div>
                    <div className="text-xs text-gray-400">
                      Cập nhật: {device.lastUpdate}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {device.type === "actuator" ? (
                      <button
                        disabled={device.status === "offline"}
                        onClick={() => handleTogglePower(device.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          device.status === "offline"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : device.isOn
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {device.isOn ? "Đang BẬT" : "Đang TẮT"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Tự động đo</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(device)}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="text-red-600 hover:underline text-xs font-medium"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Sửa thiết bị */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800">
              {editingDevice ? "Cập nhật thiết bị" : "Thêm thiết bị IoT mới"}
            </h2>
            <form onSubmit={handleSaveDevice} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tên thiết bị
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Quạt hút phòng 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Loại thiết bị
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="sensor">Cảm biến (Sensor)</option>
                    <option value="actuator">Thiết bị điều khiển</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phòng lắp đặt
                  </label>
                  <select
                    value={formData.roomId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roomId: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Địa chỉ MAC / Node ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AA:BB:CC:11:22:05"
                    value={formData.mac}
                    onChange={(e) =>
                      setFormData({ ...formData, mac: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Trạng thái kết nối
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
                >
                  {editingDevice ? "Lưu thay đổi" : "Thêm thiết bị"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}