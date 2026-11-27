import React, { useEffect, useMemo, useState } from 'react';

const MUSHROOM_CYCLES = {
  'Nấm Linh Chi': { totalDays: 45, spawnEnd: 14, pinningEnd: 30 },
  'Nấm Bào Ngư': { totalDays: 30, spawnEnd: 10, pinningEnd: 20 },
  DEFAULT: { totalDays: 35, spawnEnd: 12, pinningEnd: 24 },
};

const INITIAL_GROWTH_LOGS = {
  'T-A01': [
    {
      id: 'LOG-1',
      day: 10,
      date: '11/11/2026',
      stage: 'Ươm tơ',
      health: 'Tốt',
      note: 'Tơ nấm ăn trắng đều 70% bịch phôi, không có dấu hiệu nhiễm mốc.',
      author: 'Nhân viên vận hành',
    },
    {
      id: 'LOG-2',
      day: 22,
      date: '23/11/2026',
      stage: 'Ra nụ',
      health: 'Tốt',
      note: 'Bắt đầu nhú mầm quả thể đồng đều, duy trì phun sương 2 lần/ngày.',
      author: 'Nhân viên vận hành',
    },
  ],
  'T-A02': [
    {
      id: 'LOG-3',
      day: 45,
      date: '23/11/2026',
      stage: 'Sẵn sàng thu hoạch',
      health: 'Tốt',
      note: 'Mũ nấm Linh Chi dày, viền vàng đã chuyển nâu đỏ hoàn toàn. Đạt chuẩn thu hoạch.',
      author: 'Nhân viên vận hành',
    },
  ],
  'T-B01': [
    {
      id: 'LOG-4',
      day: 15,
      date: '23/11/2026',
      stage: 'Ra nụ',
      health: 'Cần theo dõi',
      note: 'Phòng B1 nhiệt độ hơi cao, đã tăng cường thông gió để tránh khô đầu nụ nấm.',
      author: 'Nhân viên vận hành',
    },
  ],
};

const STAGE_BADGE = {
  'Ươm tơ': 'bg-blue-100 text-blue-700',
  'Ra nụ': 'bg-purple-100 text-purple-700',
  'Phát triển quả thể': 'bg-emerald-100 text-emerald-700',
  'Sẵn sàng thu hoạch': 'bg-amber-100 text-amber-700',
};

const HEALTH_BADGE = {
  'Tốt': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cần theo dõi': 'bg-amber-50 text-amber-700 border-amber-200',
  'Cảnh báo': 'bg-red-50 text-red-700 border-red-200',
};

function getGrowthInfo(tray) {
  const cycle = MUSHROOM_CYCLES[tray.mushroom] || MUSHROOM_CYCLES.DEFAULT;
  const day = Number(tray.day) || 0;
  const progress = Math.min(Math.round((day / cycle.totalDays) * 100), 100);
  const remainingDays = Math.max(cycle.totalDays - day, 0);

  let stage = 'Ươm tơ';
  if (tray.status === 'Sẵn sàng thu hoạch' || day >= cycle.totalDays) {
    stage = 'Sẵn sàng thu hoạch';
  } else if (day > cycle.pinningEnd) {
    stage = 'Phát triển quả thể';
  } else if (day > cycle.spawnEnd) {
    stage = 'Ra nụ';
  }

  return {
    totalDays: cycle.totalDays,
    progress,
    remainingDays,
    stage,
  };
}

export default function GrowthTracking({ rooms = [], setRooms }) {
  const [selectedRoomId, setSelectedRoomId] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  // State lưu nhật ký sinh trưởng & đánh giá sức khỏe theo mã khay
  const [growthLogs, setGrowthLogs] = useState(INITIAL_GROWTH_LOGS);
  const [trayHealthMap, setTrayHealthMap] = useState({
    'T-B01': 'Cần theo dõi',
  });

  // Form thêm nhật ký chăm sóc
  const [logHealth, setLogHealth] = useState('Tốt');
  const [logNote, setLogNote] = useState('');
  const [formError, setFormError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Gom toàn bộ khay đang hoạt động (khác 'Trống') kèm thông tin phòng
  const activeTrays = useMemo(() => {
    return rooms.flatMap((room) =>
      room.trays
        .filter((tray) => tray.status !== 'Trống')
        .map((tray) => {
          const growth = getGrowthInfo(tray);
          const health = trayHealthMap[tray.id] || 'Tốt';
          return {
            ...tray,
            roomId: room.id,
            roomName: room.name,
            roomCode: room.code,
            roomStatus: room.status,
            health,
            ...growth,
          };
        })
    );
  }, [rooms, trayHealthMap]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    return {
      total: activeTrays.length,
      spawn: activeTrays.filter((t) => t.stage === 'Ươm tơ').length,
      growing: activeTrays.filter(
        (t) => t.stage === 'Ra nụ' || t.stage === 'Phát triển quả thể'
      ).length,
      ready: activeTrays.filter((t) => t.stage === 'Sẵn sàng thu hoạch').length,
    };
  }, [activeTrays]);

  // Lọc danh sách khay
  const filteredTrays = useMemo(() => {
    return activeTrays.filter((tray) => {
      const matchRoom =
        selectedRoomId === 'ALL' ||
        Number(tray.roomId) === Number(selectedRoomId);
      const matchStage =
        stageFilter === 'ALL' || tray.stage === stageFilter;

      const keyword = searchTerm.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        tray.id.toLowerCase().includes(keyword) ||
        tray.mushroom.toLowerCase().includes(keyword) ||
        tray.renter.toLowerCase().includes(keyword) ||
        tray.roomCode.toLowerCase().includes(keyword);

      return matchRoom && matchStage && matchSearch;
    });
  }, [activeTrays, selectedRoomId, stageFilter, searchTerm]);

  // Tự động đồng bộ khay đang chọn với danh sách đã lọc
  useEffect(() => {
    if (filteredTrays.length === 0) {
      setSelectedTrayId(null);
      return;
    }
    const stillVisible = filteredTrays.some((t) => t.id === selectedTrayId);
    if (!stillVisible) {
      setSelectedTrayId(filteredTrays[0].id);
    }
  }, [filteredTrays, selectedTrayId]);

  const selectedTray =
    filteredTrays.find((t) => t.id === selectedTrayId) ?? null;

  // Tăng ngày nuôi (giới hạn không vượt quá chu kỳ chuẩn totalDays)
  const handleAdvanceDay = (tray, increment = 1) => {
    if (typeof setRooms !== 'function') return;

    const cycle = MUSHROOM_CYCLES[tray.mushroom] || MUSHROOM_CYCLES.DEFAULT;
    const currentDay = Number(tray.day) || 0;

    if (currentDay >= cycle.totalDays) {
      setFeedbackMsg(
        `Khay ${tray.id} đã đạt tối đa chu kỳ (${cycle.totalDays}/${cycle.totalDays} ngày) và sẵn sàng thu hoạch.`
      );
      return;
    }

    const nextDay = Math.min(cycle.totalDays, Math.max(1, currentDay + increment));
    const nextStatus =
      nextDay >= cycle.totalDays ? 'Sẵn sàng thu hoạch' : 'Đang nuôi';

    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id !== tray.roomId) return room;
        return {
          ...room,
          trays: room.trays.map((item) =>
            item.id === tray.id
              ? { ...item, day: nextDay, status: nextStatus }
              : item
          ),
        };
      })
    );

    setFeedbackMsg(
      nextStatus === 'Sẵn sàng thu hoạch' && tray.status !== 'Sẵn sàng thu hoạch'
        ? `Khay ${tray.id} đã đạt ngày ${nextDay}/${cycle.totalDays} và tự động chuyển sang "Sẵn sàng thu hoạch".`
        : `Đã cập nhật tiến độ khay ${tray.id} sang Ngày ${nextDay}.`
    );
  };

  // Đánh dấu đạt chuẩn thu hoạch sớm
  const handleMarkReadyToHarvest = (tray) => {
    if (typeof setRooms !== 'function' || tray.status === 'Sẵn sàng thu hoạch') {
      return;
    }

    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        if (room.id !== tray.roomId) return room;
        return {
          ...room,
          trays: room.trays.map((item) =>
            item.id === tray.id
              ? { ...item, status: 'Sẵn sàng thu hoạch' }
              : item
          ),
        };
      })
    );

    setFeedbackMsg(
      `Đã xác nhận khay ${tray.id} đạt chuẩn và chuyển sang trạng thái "Sẵn sàng thu hoạch".`
    );
  };

  // Thêm nhật ký theo dõi sinh trưởng
  const handleAddLogSubmit = (e) => {
    e.preventDefault();
    if (!selectedTray) return;

    const trimmedNote = logNote.trim();
    if (!trimmedNote) {
      setFormError('Vui lòng nhập nội dung ghi chú chăm sóc hoặc tình trạng nấm.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');
    const newEntry = {
      id: `LOG-${Date.now()}`,
      day: selectedTray.day,
      date: todayStr,
      stage: selectedTray.stage,
      health: logHealth,
      note: trimmedNote,
      author: 'Nhân viên vận hành',
    };

    setGrowthLogs((prev) => ({
      ...prev,
      [selectedTray.id]: [newEntry, ...(prev[selectedTray.id] || [])],
    }));

    setTrayHealthMap((prev) => ({
      ...prev,
      [selectedTray.id]: logHealth,
    }));

    setLogNote('');
    setFormError('');
    setFeedbackMsg(`Đã lưu nhật ký sinh trưởng cho khay ${selectedTray.id}.`);
  };

  const currentTrayLogs = selectedTray
    ? growthLogs[selectedTray.id] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Tiến độ sinh trưởng đồng bộ trực tiếp với danh
          sách khay đang nuôi từ <code>App.jsx</code>. Khi cập nhật ngày nuôi
          đạt chu kỳ chuẩn, khay sẽ tự chuyển sang trạng thái{' '}
          <strong>Sẵn sàng thu hoạch</strong>.
        </p>
      </div>

      {/* THỐNG KÊ TỔNG QUAN */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tổng quan quá trình sinh trưởng
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Phân loại các khay đang hoạt động theo từng giai đoạn phát triển của nấm
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Khay đang theo dõi"
            value={stats.total}
            description="Không tính các khay trống"
            color="text-gray-800"
          />
          <StatCard
            title="Giai đoạn ươm tơ"
            value={stats.spawn}
            description="Tơ nấm đang lan giá thể"
            color="text-blue-600"
          />
          <StatCard
            title="Ra nụ & Phát triển"
            value={stats.growing}
            description="Đang hình thành quả thể"
            color="text-emerald-600"
          />
          <StatCard
            title="Sẵn sàng thu hoạch"
            value={stats.ready}
            description="Đã đạt độ tuổi thu hoạch"
            color="text-amber-600"
          />
        </div>
      </section>

      {/* DANH SÁCH KHAY THEO DÕI */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Tiến độ sinh trưởng theo khay
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Chọn khay để cập nhật ngày nuôi, đánh giá sức khỏe và ghi nhật ký chăm sóc
              </p>
            </div>

            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              Hiển thị {filteredTrays.length}/{activeTrays.length} khay đang nuôi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã khay, loại nấm, mã phòng hoặc khách thuê..."
              className="md:col-span-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <select
              value={selectedRoomId}
              onChange={(e) =>
                setSelectedRoomId(
                  e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                )
              }
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả phòng nuôi</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { value: 'ALL', label: 'Tất cả giai đoạn' },
              { value: 'Ươm tơ', label: 'Ươm tơ' },
              { value: 'Ra nụ', label: 'Ra nụ' },
              { value: 'Phát triển quả thể', label: 'Phát triển quả thể' },
              { value: 'Sẵn sàng thu hoạch', label: 'Sẵn sàng thu hoạch' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStageFilter(item.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                  stageFilter === item.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Khay / Phòng</th>
                <th className="py-3 px-4">Loại nấm</th>
                <th className="py-3 px-4">Giai đoạn</th>
                <th className="py-3 px-4 w-52">Tiến độ chu kỳ</th>
                <th className="py-3 px-4">Tình trạng phôi</th>
                <th className="py-3 px-4 text-right">Cập nhật nhanh</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredTrays.map((tray) => {
                const isSelected = tray.id === selectedTrayId;
                const isMaxDay = tray.day >= tray.totalDays;

                return (
                  <tr
                    key={tray.id}
                    onClick={() => {
                      setSelectedTrayId(tray.id);
                      setFeedbackMsg('');
                      setFormError('');
                    }}
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-emerald-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">
                        {tray.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tray.roomCode} • {tray.renter}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-700">{tray.mushroom}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          STAGE_BADGE[tray.stage] ||
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tray.stage}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">
                          Ngày {tray.day}/{tray.totalDays}
                        </span>
                        <span className="text-gray-500">{tray.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            tray.stage === 'Sẵn sàng thu hoạch'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${tray.progress}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          HEALTH_BADGE[tray.health] || HEALTH_BADGE['Tốt']
                        }`}
                      >
                        {tray.health}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 text-right space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={isMaxDay}
                        onClick={() => handleAdvanceDay(tray, 1)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          isMaxDay
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer'
                        }`}
                      >
                        +1 ngày
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrayId(tray.id);
                          setFeedbackMsg('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        Nhật ký
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredTrays.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">
                    Không có khay đang nuôi nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* CHI TIẾT & NHẬT KÝ CHĂM SÓC KHAY ĐANG CHỌN */}
        {selectedTray && (
          <div className="border-t border-gray-100 p-5 bg-gray-50/60 space-y-5">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base font-semibold text-gray-800">
                    Nhật ký sinh trưởng — Khay {selectedTray.id}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      STAGE_BADGE[selectedTray.stage]
                    }`}
                  >
                    {selectedTray.stage}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedTray.roomName} ({selectedTray.roomCode}) •{' '}
                  {selectedTray.mushroom} • {selectedTray.renter}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={selectedTray.day >= selectedTray.totalDays}
                  onClick={() => handleAdvanceDay(selectedTray, 1)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                    selectedTray.day >= selectedTray.totalDays
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                  }`}
                >
                  Tăng +1 ngày nuôi
                </button>

                {selectedTray.status !== 'Sẵn sàng thu hoạch' && (
                  <button
                    type="button"
                    onClick={() => handleMarkReadyToHarvest(selectedTray)}
                    className="px-3.5 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
                  >
                    Xác nhận sẵn sàng thu hoạch
                  </button>
                )}
              </div>
            </div>

            {feedbackMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <p className="text-sm text-emerald-800 font-medium">
                  {feedbackMsg}
                </p>
              </div>
            )}

            {/* Thông số chu kỳ của khay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Tuổi phôi hiện tại</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  Ngày {selectedTray.day} / {selectedTray.totalDays} ngày
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Dự kiến còn lại</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {selectedTray.remainingDays === 0
                    ? 'Đã đến kỳ thu hoạch'
                    : `Khoảng ${selectedTray.remainingDays} ngày nữa`}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Sức khỏe phôi nấm</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {selectedTray.health}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Môi trường phòng</p>
                <p
                  className={`text-sm font-semibold mt-1 ${
                    selectedTray.roomStatus === 'WARNING'
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {selectedTray.roomStatus === 'WARNING'
                    ? '⚠ Phòng đang có cảnh báo'
                    : '● Môi trường ổn định'}
                </p>
              </div>
            </div>

            {/* Form ghi nhận nhật ký mới */}
            <form
              onSubmit={handleAddLogSubmit}
              className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-gray-800">
                Thêm ghi nhận chăm sóc mới (Ngày {selectedTray.day})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Đánh giá tình trạng phôi
                  </label>
                  <select
                    value={logHealth}
                    onChange={(e) => setLogHealth(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Cần theo dõi">Cần theo dõi</option>
                    <option value="Cảnh báo">Cảnh báo</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Ghi chú kiểm tra / thao tác chăm sóc *
                  </label>
                  <input
                    type="text"
                    value={logNote}
                    onChange={(e) => {
                      setLogNote(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="VD: Tơ nấm phát triển tốt, đã điều chỉnh độ ẩm phun sương buổi sáng..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600 font-medium">{formError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition cursor-pointer"
                >
                  Lưu nhật ký
                </button>
              </div>
            </form>

            {/* Lịch sử nhật ký */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-semibold text-gray-800">
                Lịch sử theo dõi ({currentTrayLogs.length} bản ghi)
              </h4>

              {currentTrayLogs.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg p-4">
                  Chưa có ghi nhận chăm sóc nào cho khay {selectedTray.id}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {currentTrayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">
                            Ngày {log.day} ({log.date})
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              STAGE_BADGE[log.stage] ||
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.stage}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                              HEALTH_BADGE[log.health] || HEALTH_BADGE['Tốt']
                            }`}
                          >
                            {log.health}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1.5">
                          {log.note}
                        </p>
                      </div>

                      <span className="text-xs text-gray-400 shrink-0">
                        Bởi: {log.author}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
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