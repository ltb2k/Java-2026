import React, { useEffect, useMemo, useState } from 'react';

const STATUS_BADGE = {
  'Đang nuôi': 'bg-emerald-100 text-emerald-700',
  'Sẵn sàng thu hoạch': 'bg-amber-100 text-amber-700',
  'Trống': 'bg-slate-100 text-slate-600',
};

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'Đang nuôi', label: 'Đang nuôi' },
  { value: 'Sẵn sàng thu hoạch', label: 'Sẵn sàng thu hoạch' },
  { value: 'Trống', label: 'Trống' },
];

export default function RoomsAndTrays({ rooms = [], setRooms }) {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  // State thêm phòng mới
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: '',
    code: '',
    mushroom: 'Nấm Linh Chi',
    capacity: 20,
  });
  const [roomFormError, setRoomFormError] = useState('');

  // State chỉnh sửa phòng đang chọn
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({
    name: '',
    mushroom: '',
    capacity: 20,
  });
  const [editRoomError, setEditRoomError] = useState('');

  // State thêm khay mới
  const [isAddingTray, setIsAddingTray] = useState(false);
  const [newTrayCode, setNewTrayCode] = useState('');
  const [addTrayError, setAddTrayError] = useState('');

  // State chỉnh sửa thông tin khay
  const [isEditingTray, setIsEditingTray] = useState(false);
  const [editTrayForm, setEditTrayForm] = useState({
    id: '',
    mushroom: '',
    day: 0,
    renter: '',
  });
  const [editTrayError, setEditTrayError] = useState('');

  useEffect(() => {
    if (rooms.length === 0) {
      setSelectedRoomId(null);
      return;
    }
    const exists = rooms.some((room) => room.id === selectedRoomId);
    if (!exists) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const currentRoom = rooms.find((room) => room.id === selectedRoomId);

  const selectedTray =
    currentRoom?.trays.find((tray) => tray.id === selectedTrayId) ?? null;

  const statistics = useMemo(() => {
    const allTrays = rooms.flatMap((room) => room.trays);

    return {
      total: allTrays.length,
      growing: allTrays.filter((tray) => tray.status === 'Đang nuôi').length,
      ready: allTrays.filter((tray) => tray.status === 'Sẵn sàng thu hoạch').length,
      empty: allTrays.filter((tray) => tray.status === 'Trống').length,
    };
  }, [rooms]);

  const filteredTrays = useMemo(() => {
    if (!currentRoom) return [];

    return currentRoom.trays.filter((tray) => {
      const matchesStatus =
        statusFilter === 'ALL' || tray.status === statusFilter;

      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        tray.id.toLowerCase().includes(keyword) ||
        tray.mushroom.toLowerCase().includes(keyword) ||
        tray.renter.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [currentRoom, statusFilter, searchTerm]);

  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setSelectedTrayId(null);
    setStatusFilter('ALL');
    setSearchTerm('');
    setIsAddingTray(false);
    setIsEditingTray(false);
    setIsEditingRoom(false);
  };

  const handleAddRoomSubmit = (event) => {
    event.preventDefault();

    const trimmedName = roomForm.name.trim();
    const trimmedCode = roomForm.code.trim().toUpperCase();
    const trimmedMushroom = roomForm.mushroom.trim();
    const parsedCapacity = Number(roomForm.capacity);

    if (!trimmedName || !trimmedCode || !trimmedMushroom) {
      setRoomFormError('Vui lòng nhập đầy đủ tên phòng, mã phòng và loại nấm.');
      return;
    }

    if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      setRoomFormError('Sức chứa phải là số nguyên lớn hơn 0.');
      return;
    }

    const isDuplicateCode = rooms.some(
      (room) => room.code.toLowerCase() === trimmedCode.toLowerCase()
    );
    if (isDuplicateCode) {
      setRoomFormError('Mã phòng đã tồn tại trong hệ thống!');
      return;
    }

    const newRoom = {
      id: Date.now(),
      name: trimmedName,
      code: trimmedCode,
      mushroom: trimmedMushroom,
      capacity: parsedCapacity,
      status: 'NORMAL',
      alert: null,
      trays: [],
    };

    if (typeof setRooms === 'function') {
      setRooms((prev) => [...prev, newRoom]);
    }
    setSelectedRoomId(newRoom.id);
    setSelectedTrayId(null);
    setRoomForm({
      name: '',
      code: '',
      mushroom: 'Nấm Linh Chi',
      capacity: 20,
    });
    setRoomFormError('');
    setIsAddingRoom(false);
  };

  const handleOpenEditRoom = () => {
    if (!currentRoom) return;
    setEditRoomForm({
      name: currentRoom.name,
      mushroom: currentRoom.mushroom,
      capacity: currentRoom.capacity,
    });
    setEditRoomError('');
    setIsEditingRoom(true);
  };

  const handleEditRoomSubmit = (event) => {
    event.preventDefault();
    if (!currentRoom) return;

    const trimmedName = editRoomForm.name.trim();
    const trimmedMushroom = editRoomForm.mushroom.trim();
    const parsedCapacity = Number(editRoomForm.capacity);

    if (!trimmedName || !trimmedMushroom) {
      setEditRoomError('Tên phòng và loại nấm không được để trống.');
      return;
    }

    if (
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < currentRoom.trays.length
    ) {
      setEditRoomError(
        `Sức chứa tối thiểu phải bằng số khay hiện có (${currentRoom.trays.length} khay).`
      );
      return;
    }

    if (typeof setRooms === 'function') {
      setRooms((prev) =>
        prev.map((room) =>
          room.id === currentRoom.id
            ? {
                ...room,
                name: trimmedName,
                mushroom: trimmedMushroom,
                capacity: parsedCapacity,
              }
            : room
        )
      );
    }
    setEditRoomError('');
    setIsEditingRoom(false);
  };

  const updateTray = (trayId, updateData) => {
    if (typeof setRooms !== 'function') return;
    setRooms((previousRooms) =>
      previousRooms.map((room) => {
        if (room.id !== selectedRoomId) {
          return room;
        }

        return {
          ...room,
          trays: room.trays.map((tray) =>
            tray.id === trayId ? { ...tray, ...updateData } : tray
          ),
        };
      })
    );
  };

  const handleAddTraySubmit = (event) => {
    event.preventDefault();
    if (!currentRoom) return;

    const newTrayId = newTrayCode.trim().toUpperCase();
    if (!newTrayId) {
      setAddTrayError('Vui lòng nhập mã khay mới (VD: T-A05).');
      return;
    }

    const isDuplicate = rooms.some((room) =>
      room.trays.some(
        (tray) => tray.id.toLowerCase() === newTrayId.toLowerCase()
      )
    );
    if (isDuplicate) {
      setAddTrayError('Mã khay đã tồn tại trong hệ thống!');
      return;
    }

    if (currentRoom.trays.length >= currentRoom.capacity) {
      setAddTrayError('Phòng đã đạt sức chứa tối đa!');
      return;
    }

    const newTray = {
      id: newTrayId,
      mushroom: '-',
      day: 0,
      status: 'Trống',
      renter: '-',
    };

    if (typeof setRooms === 'function') {
      setRooms((previousRooms) =>
        previousRooms.map((room) =>
          room.id === selectedRoomId
            ? { ...room, trays: [...room.trays, newTray] }
            : room
        )
      );
    }

    setStatusFilter('ALL');
    setSearchTerm('');
    setSelectedTrayId(newTrayId);
    setIsEditingTray(false);
    setNewTrayCode('');
    setAddTrayError('');
    setIsAddingTray(false);
  };

  const handleOpenEditTray = (tray) => {
    setEditTrayForm({
      id: tray.id,
      mushroom: tray.mushroom === '-' ? '' : tray.mushroom,
      day: tray.day,
      renter: tray.renter === '-' ? '' : tray.renter,
    });
    setEditTrayError('');
    setIsEditingTray(true);
  };

  const handleEditTraySubmit = (event) => {
    event.preventDefault();
    if (!selectedTray || !currentRoom) return;

    const updatedId = editTrayForm.id.trim().toUpperCase();
    if (!updatedId) {
      setEditTrayError('Mã khay không được để trống.');
      return;
    }

    if (updatedId.toLowerCase() !== selectedTray.id.toLowerCase()) {
      const isDuplicate = rooms.some((room) =>
        room.trays.some(
          (tray) => tray.id.toLowerCase() === updatedId.toLowerCase()
        )
      );
      if (isDuplicate) {
        setEditTrayError('Mã khay này đã tồn tại trong hệ thống!');
        return;
      }
    }

    const isTrayEmpty = selectedTray.status === 'Trống';
    const parsedDay = Number(editTrayForm.day);

    if (!isTrayEmpty && (!Number.isInteger(parsedDay) || parsedDay < 1)) {
      setEditTrayError('Ngày nuôi của khay đang hoạt động phải >= 1.');
      return;
    }

    updateTray(selectedTray.id, {
      id: updatedId,
      mushroom: isTrayEmpty
        ? '-'
        : editTrayForm.mushroom.trim() || currentRoom.mushroom,
      day: isTrayEmpty ? 0 : parsedDay,
      renter: isTrayEmpty ? '-' : editTrayForm.renter.trim() || 'Khách thuê mẫu',
    });

    setSelectedTrayId(updatedId);
    setEditTrayError('');
    setIsEditingTray(false);
  };

  const canDeleteTray = (tray) => {
    if (!tray) return false;
    const hasNoRenter = !tray.renter || tray.renter === '-';
    return tray.status === 'Trống' && hasNoRenter;
  };

  const handleDeleteTray = (tray) => {
    if (!canDeleteTray(tray)) return;

    if (typeof setRooms === 'function') {
      setRooms((previousRooms) =>
        previousRooms.map((room) =>
          room.id === selectedRoomId
            ? {
                ...room,
                trays: room.trays.filter((item) => item.id !== tray.id),
              }
            : room
        )
      );
    }

    if (selectedTrayId === tray.id) {
      setSelectedTrayId(null);
      setIsEditingTray(false);
    }
  };

  const handleStartGrowing = (tray) => {
    if (tray.status !== 'Trống') return;

    updateTray(tray.id, {
      mushroom: currentRoom.mushroom,
      day: 1,
      status: 'Đang nuôi',
      renter: 'Khách thuê mẫu',
    });
    setIsEditingTray(false);
  };

  const handleReadyHarvest = (tray) => {
    if (tray.status !== 'Đang nuôi') return;

    updateTray(tray.id, {
      status: 'Sẵn sàng thu hoạch',
    });
    setIsEditingTray(false);
  };

  const handleCompleteHarvest = (tray) => {
    if (tray.status !== 'Sẵn sàng thu hoạch') return;

    updateTray(tray.id, {
      mushroom: '-',
      day: 0,
      status: 'Trống',
      renter: '-',
    });
    setIsEditingTray(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Dữ liệu phòng & khay đang dùng chung từ{' '}
          <code>App.jsx</code>. Khi duyệt đơn thuê bên trang{' '}
          <strong>Yêu cầu thuê</strong>, khay được gán sẽ tự chuyển sang{' '}
          <strong>Đang nuôi</strong>.
        </p>
      </div>

      {/* THỐNG KÊ */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Tổng quan phòng và khay
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Thống kê trên toàn bộ các phòng và khay hiện có
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Tổng số khay"
            value={statistics.total}
            description={`${rooms.length} phòng nuôi`}
            color="text-gray-800"
          />
          <StatCard
            title="Đang nuôi"
            value={statistics.growing}
            description="Khay đang phát triển"
            color="text-emerald-600"
          />
          <StatCard
            title="Sẵn sàng thu hoạch"
            value={statistics.ready}
            description="Khay đã đến kỳ thu"
            color="text-amber-600"
          />
          <StatCard
            title="Khay trống"
            value={statistics.empty}
            description="Sẵn sàng phân bổ"
            color="text-slate-600"
          />
        </div>
      </section>

      {/* DANH SÁCH PHÒNG */}
      <section>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Danh sách phòng nuôi
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Chọn phòng để xem thông tin và quản lý danh sách khay
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingRoom((prev) => !prev);
              setRoomFormError('');
            }}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            {isAddingRoom ? 'Đóng form phòng' : '+ Thêm phòng nuôi'}
          </button>
        </div>

        {isAddingRoom && (
          <form
            onSubmit={handleAddRoomSubmit}
            className="mb-5 bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Thêm phòng nuôi mới
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Tên phòng *
                </label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, name: e.target.value })
                  }
                  placeholder="VD: Phòng Nấm Mối - Khu C"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Mã phòng *
                </label>
                <input
                  type="text"
                  value={roomForm.code}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, code: e.target.value })
                  }
                  placeholder="VD: ROOM-C1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Loại nấm chính *
                </label>
                <input
                  type="text"
                  value={roomForm.mushroom}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, mushroom: e.target.value })
                  }
                  placeholder="VD: Nấm Linh Chi"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Sức chứa tối đa (khay) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={roomForm.capacity}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, capacity: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {roomFormError && (
              <p className="text-xs text-red-600 font-medium mt-3">
                {roomFormError}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingRoom(false);
                  setRoomFormError('');
                }}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer"
              >
                Tạo phòng
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const usedTraysCount = room.trays.filter(
              (t) => t.status !== 'Trống'
            ).length;
            const occupiedRate =
              room.capacity > 0
                ? Math.round((room.trays.length / room.capacity) * 100)
                : 0;

            return (
              <div
                key={room.id}
                onClick={() => handleSelectRoom(room.id)}
                className={`text-left bg-white rounded-xl border p-5 shadow-sm transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 ring-1 ring-emerald-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Mã phòng: {room.code} • Loại nấm: {room.mushroom}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                      room.status === 'WARNING'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {room.status === 'WARNING' ? 'Cảnh báo' : 'Ổn định'}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                      Số khay đã lắp đặt / Sức chứa
                    </span>
                    <strong className="text-gray-800">
                      {room.trays.length}/{room.capacity} khay
                    </strong>
                  </div>

                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(occupiedRate, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Tỷ lệ lấp đầy: {occupiedRate}% ({usedTraysCount} khay đang
                    hoạt động)
                  </p>
                </div>

                {room.alert && (
                  <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-red-700">
                      <strong>Cảnh báo:</strong> {room.alert}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Còn trống {Math.max(room.capacity - room.trays.length, 0)}{' '}
                    vị trí khay
                  </span>
                  <span className="text-sm font-medium text-emerald-700">
                    {isSelected ? 'Đang chọn' : 'Xem phòng →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DANH SÁCH KHAY CỦA PHÒNG ĐANG CHỌN */}
      {currentRoom && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Danh sách khay — {currentRoom.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Mã phòng: {currentRoom.code} • Loại nấm: {currentRoom.mushroom}{' '}
                  • Sức chứa: {currentRoom.trays.length}/{currentRoom.capacity}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                  Hiển thị {filteredTrays.length}/{currentRoom.trays.length} khay
                </span>

                <button
                  type="button"
                  onClick={handleOpenEditRoom}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Sửa phòng
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTray((prev) => !prev);
                    setNewTrayCode('');
                    setAddTrayError('');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                >
                  {isAddingTray ? 'Đóng form' : '+ Thêm khay mới'}
                </button>
              </div>
            </div>

            {isEditingRoom && (
              <form
                onSubmit={handleEditRoomSubmit}
                className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Chỉnh sửa thông tin phòng ({currentRoom.code})
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Tên phòng *
                    </label>
                    <input
                      type="text"
                      value={editRoomForm.name}
                      onChange={(e) =>
                        setEditRoomForm({
                          ...editRoomForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Loại nấm *
                    </label>
                    <input
                      type="text"
                      value={editRoomForm.mushroom}
                      onChange={(e) =>
                        setEditRoomForm({
                          ...editRoomForm,
                          mushroom: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Sức chứa tối đa *
                    </label>
                    <input
                      type="number"
                      min={currentRoom.trays.length || 1}
                      value={editRoomForm.capacity}
                      onChange={(e) =>
                        setEditRoomForm({
                          ...editRoomForm,
                          capacity: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {editRoomError && (
                  <p className="text-xs text-red-600 font-medium mt-2">
                    {editRoomError}
                  </p>
                )}

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingRoom(false);
                      setEditRoomError('');
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 text-sm rounded-lg cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}

            {isAddingTray && (
              <form
                onSubmit={handleAddTraySubmit}
                className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTrayCode}
                    onChange={(event) => {
                      setNewTrayCode(event.target.value);
                      if (addTrayError) setAddTrayError('');
                    }}
                    placeholder="Nhập mã khay mới (VD: T-A05)..."
                    autoFocus
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                    >
                      Lưu khay
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingTray(false);
                        setAddTrayError('');
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 text-sm rounded-lg transition cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>

                {addTrayError && (
                  <p className="text-xs text-red-600 font-medium mt-2">
                    {addTrayError}
                  </p>
                )}
              </form>
            )}

            <div className="mt-5">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo mã khay, loại nấm hoặc khách thuê..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {FILTER_OPTIONS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    statusFilter === filter.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Mã khay</th>
                  <th className="py-3 px-4">Loại nấm</th>
                  <th className="py-3 px-4">Ngày nuôi</th>
                  <th className="py-3 px-4">Bên thuê</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredTrays.map((tray) => {
                  const deletable = canDeleteTray(tray);

                  return (
                    <tr key={tray.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {tray.id}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{tray.mushroom}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {tray.status === 'Trống' ? '-' : `Ngày ${tray.day}`}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{tray.renter}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            STATUS_BADGE[tray.status] ||
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tray.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTrayId(tray.id);
                            setIsEditingTray(false);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          Chi tiết
                        </button>

                        {deletable && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTray(tray)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          >
                            Xóa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredTrays.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-500">
                      Không có khay nào khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedTray && (
            <div className="border-t border-gray-100 p-5 bg-gray-50/60 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-gray-800">
                    Chi tiết khay {selectedTray.id}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      STATUS_BADGE[selectedTray.status] ||
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedTray.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {!isEditingTray && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditTray(selectedTray)}
                      className="text-sm font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      Sửa thông tin
                    </button>
                  )}

                  {canDeleteTray(selectedTray) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTray(selectedTray)}
                      className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      Xóa khay
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrayId(null);
                      setIsEditingTray(false);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {isEditingTray ? (
                <form
                  onSubmit={handleEditTraySubmit}
                  className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Mã khay *
                      </label>
                      <input
                        type="text"
                        value={editTrayForm.id}
                        onChange={(e) =>
                          setEditTrayForm({
                            ...editTrayForm,
                            id: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Loại nấm
                      </label>
                      <input
                        type="text"
                        disabled={selectedTray.status === 'Trống'}
                        value={editTrayForm.mushroom}
                        onChange={(e) =>
                          setEditTrayForm({
                            ...editTrayForm,
                            mushroom: e.target.value,
                          })
                        }
                        placeholder={
                          selectedTray.status === 'Trống'
                            ? 'Khay trống'
                            : currentRoom.mushroom
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Ngày nuôi
                      </label>
                      <input
                        type="number"
                        min={selectedTray.status === 'Trống' ? 0 : 1}
                        disabled={selectedTray.status === 'Trống'}
                        value={editTrayForm.day}
                        onChange={(e) =>
                          setEditTrayForm({
                            ...editTrayForm,
                            day: e.target.value,
                          })
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Bên thuê
                    </label>
                    <input
                      type="text"
                      disabled={selectedTray.status === 'Trống'}
                      value={editTrayForm.renter}
                      onChange={(e) =>
                        setEditTrayForm({
                          ...editTrayForm,
                          renter: e.target.value,
                        })
                      }
                      placeholder={
                        selectedTray.status === 'Trống'
                          ? '-'
                          : 'VD: Khách thuê #115'
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                    />
                  </div>

                  {editTrayError && (
                    <p className="text-xs text-red-600 font-medium">
                      {editTrayError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingTray(false);
                        setEditTrayError('');
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer"
                    >
                      Lưu thông tin
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Loại nấm</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {selectedTray.mushroom}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Ngày nuôi</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {selectedTray.status === 'Trống'
                        ? '-'
                        : `Ngày ${selectedTray.day}`}
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Bên thuê</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {selectedTray.renter}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {selectedTray.status === 'Trống' && (
                  <button
                    type="button"
                    onClick={() => handleStartGrowing(selectedTray)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                  >
                    Bắt đầu nuôi
                  </button>
                )}

                {selectedTray.status === 'Đang nuôi' && (
                  <button
                    type="button"
                    onClick={() => handleReadyHarvest(selectedTray)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
                  >
                    Chuyển sang sẵn sàng thu hoạch
                  </button>
                )}

                {selectedTray.status === 'Sẵn sàng thu hoạch' && (
                  <button
                    type="button"
                    onClick={() => handleCompleteHarvest(selectedTray)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
                  >
                    Hoàn tất thu hoạch (Trả khay trống)
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatCard({ title, value, description, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}