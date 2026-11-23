import React, { useEffect, useMemo, useState } from 'react';

const INITIAL_HARVEST_RECORDS = [
  {
    id: 'HV-2026-01',
    trayId: 'T-A01',
    roomId: 1,
    roomCode: 'ROOM-A1',
    roomName: 'Phòng Nấm Linh Chi - Khu A',
    mushroom: 'Nấm Linh Chi',
    renter: 'Khách thuê #102',
    day: 45,
    weightKg: 3.4,
    quality: 'Loại 1',
    harvestedAt: '15/11/2026',
    note: 'Tai nấm dày, đều màu, đóng gói bàn giao đủ cho khách thuê.',
    trayResetToEmpty: true,
  },
  {
    id: 'HV-2026-02',
    trayId: 'T-B01',
    roomId: 2,
    roomCode: 'ROOM-B1',
    roomName: 'Phòng Nấm Bào Ngư - Khu B',
    mushroom: 'Nấm Bào Ngư',
    renter: 'Khách thuê #110',
    day: 30,
    weightKg: 5.2,
    quality: 'Đạt chuẩn',
    harvestedAt: '18/11/2026',
    note: 'Thu hoạch đợt đầu trong chu kỳ, cụm nấm chắc.',
    trayResetToEmpty: false,
  },
];

const QUALITY_BADGE = {
  'Loại 1': 'bg-emerald-100 text-emerald-700',
  'Đạt chuẩn': 'bg-blue-100 text-blue-700',
  'Loại 2': 'bg-amber-100 text-amber-700',
};

export default function Harvest({ rooms = [], setRooms }) {
  const [records, setRecords] = useState(INITIAL_HARVEST_RECORDS);
  const [selectedRoomId, setSelectedRoomId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrayId, setSelectedTrayId] = useState(null);

  // Form ghi nhận thu hoạch
  const [weightInput, setWeightInput] = useState('');
  const [qualityInput, setQualityInput] = useState('Loại 1');
  const [noteInput, setNoteInput] = useState('');
  const [resetToEmpty, setResetToEmpty] = useState(true);
  const [formError, setFormError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Gom các khay sẵn sàng thu hoạch từ rooms
  const readyTrays = useMemo(() => {
    return rooms.flatMap((room) =>
      room.trays
        .filter((tray) => tray.status === 'Sẵn sàng thu hoạch')
        .map((tray) => ({
          ...tray,
          roomId: room.id,
          roomCode: room.code,
          roomName: room.name,
        }))
    );
  }, [rooms]);

  const filteredReadyTrays = useMemo(() => {
    return readyTrays.filter((tray) => {
      const matchRoom =
        selectedRoomId === 'ALL' ||
        Number(tray.roomId) === Number(selectedRoomId);

      const keyword = searchTerm.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        tray.id.toLowerCase().includes(keyword) ||
        tray.mushroom.toLowerCase().includes(keyword) ||
        tray.renter.toLowerCase().includes(keyword) ||
        tray.roomCode.toLowerCase().includes(keyword);

      return matchRoom && matchSearch;
    });
  }, [readyTrays, selectedRoomId, searchTerm]);

  useEffect(() => {
    if (filteredReadyTrays.length === 0) {
      setSelectedTrayId(null);
      return;
    }
    const stillVisible = filteredReadyTrays.some((t) => t.id === selectedTrayId);
    if (!stillVisible) {
      setSelectedTrayId(filteredReadyTrays[0].id);
    }
  }, [filteredReadyTrays, selectedTrayId]);

  const selectedTray =
    filteredReadyTrays.find((t) => t.id === selectedTrayId) ?? null;

  const stats = useMemo(() => {
    const totalWeight = records.reduce(
      (sum, item) => sum + (Number(item.weightKg) || 0),
      0
    );
    const emptiedCount = records.filter((item) => item.trayResetToEmpty).length;

    return {
      readyCount: readyTrays.length,
      totalWeight: totalWeight.toFixed(1),
      recordCount: records.length,
      emptiedCount,
    };
  }, [readyTrays, records]);

  const handleRecordHarvest = (e) => {
    e.preventDefault();
    if (!selectedTray) {
      setFormError('Vui lòng chọn một khay đang sẵn sàng thu hoạch.');
      return;
    }

    const parsedWeight = Number(weightInput);
    if (!weightInput || Number.isNaN(parsedWeight) || parsedWeight <= 0) {
      setFormError('Vui lòng nhập sản lượng thu hoạch lớn hơn 0 (kg).');
      return;
    }

    const nextCodeNumber = String(records.length + 1).padStart(2, '0');
    const newRecord = {
      id: `HV-2026-${nextCodeNumber}`,
      trayId: selectedTray.id,
      roomId: selectedTray.roomId,
      roomCode: selectedTray.roomCode,
      roomName: selectedTray.roomName,
      mushroom: selectedTray.mushroom,
      renter: selectedTray.renter,
      day: selectedTray.day,
      weightKg: Number(parsedWeight.toFixed(2)),
      quality: qualityInput,
      harvestedAt: new Date().toLocaleDateString('vi-VN'),
      note:
        noteInput.trim() ||
        'Đã hoàn tất thu hoạch và cập nhật thông tin khay.',
      trayResetToEmpty: resetToEmpty,
    };

    if (resetToEmpty && typeof setRooms === 'function') {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id !== selectedTray.roomId) return room;
          return {
            ...room,
            trays: room.trays.map((tray) =>
              tray.id === selectedTray.id
                ? {
                    ...tray,
                    mushroom: '-',
                    day: 0,
                    status: 'Trống',
                    renter: '-',
                  }
                : tray
            ),
          };
        })
      );
    }

    setRecords((prev) => [newRecord, ...prev]);
    setWeightInput('');
    setNoteInput('');
    setFormError('');
    setFeedbackMsg(
      resetToEmpty
        ? `Đã ghi nhận phiếu ${newRecord.id} (${newRecord.weightKg} kg) cho khay ${selectedTray.id} và chuyển khay về trạng thái Trống.`
        : `Đã ghi nhận phiếu ${newRecord.id} (${newRecord.weightKg} kg) cho khay ${selectedTray.id}.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Danh sách khay sẵn sàng thu hoạch đồng bộ từ{' '}
          <code>App.jsx</code>. Khi ghi nhận thu hoạch và chọn{' '}
          <strong>Trả khay trống</strong>, khay sẽ tự động chuyển về trạng thái{' '}
          <strong>Trống</strong> bên trang <strong>Phòng & Khay</strong>.
        </p>
      </div>

      {/* THỐNG KÊ THU HOẠCH */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tổng quan thu hoạch
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi khay đến kỳ thu hoạch, tổng sản lượng và lịch sử bàn giao
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Sẵn sàng thu hoạch"
            value={stats.readyCount}
            description="Khay đang chờ xử lý"
            color="text-amber-600"
          />
          <StatCard
            title="Tổng sản lượng"
            value={`${stats.totalWeight} kg`}
            description="Đã ghi nhận trên hệ thống"
            color="text-emerald-600"
          />
          <StatCard
            title="Phiếu thu hoạch"
            value={stats.recordCount}
            description="Tổng lượt đã lưu"
            color="text-gray-800"
          />
          <StatCard
            title="Khay đã trả trống"
            value={stats.emptiedCount}
            description="Sẵn sàng tái sử dụng"
            color="text-blue-600"
          />
        </div>
      </section>

      {/* DANH SÁCH KHAY SẴN SÀNG THU HOẠCH & FORM GHI NHẬN */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Khay sẵn sàng thu hoạch
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Chọn khay để nhập sản lượng, chất lượng và hoàn tất thu hoạch
              </p>
            </div>

            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              {filteredReadyTrays.length} khay khả dụng
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Mã khay</th>
                <th className="py-3 px-4">Phòng nuôi</th>
                <th className="py-3 px-4">Loại nấm</th>
                <th className="py-3 px-4">Ngày nuôi</th>
                <th className="py-3 px-4">Bên thuê</th>
                <th className="py-3 px-4 text-right">Chọn xử lý</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredReadyTrays.map((tray) => {
                const isSelected = tray.id === selectedTrayId;

                return (
                  <tr
                    key={tray.id}
                    onClick={() => {
                      setSelectedTrayId(tray.id);
                      setFormError('');
                    }}
                    className={`transition cursor-pointer ${
                      isSelected ? 'bg-amber-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {tray.id}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {tray.roomName} ({tray.roomCode})
                    </td>
                    <td className="py-3 px-4 text-gray-700">{tray.mushroom}</td>
                    <td className="py-3 px-4 text-gray-600">
                      Ngày {tray.day}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{tray.renter}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrayId(tray.id);
                          setFormError('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Đang chọn' : 'Thu hoạch'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredReadyTrays.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">
                    Hiện không có khay nào ở trạng thái Sẵn sàng thu hoạch. Bạn
                    có thể chuyển khay sang trạng thái này bên trang{' '}
                    <strong>Theo dõi sinh trưởng</strong> hoặc{' '}
                    <strong>Phòng & Khay</strong>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {feedbackMsg && (
          <div className="mx-5 mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <p className="text-sm text-emerald-800 font-medium">
              {feedbackMsg}
            </p>
          </div>
        )}

        {selectedTray && (
          <form
            onSubmit={handleRecordHarvest}
            className="m-5 bg-gray-50/80 border border-gray-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Ghi nhận thu hoạch — Khay {selectedTray.id}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedTray.mushroom} • {selectedTray.roomCode} •{' '}
                  {selectedTray.renter} • Ngày nuôi: {selectedTray.day}
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                {selectedTray.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Sản lượng thu hoạch (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightInput}
                  onChange={(e) => {
                    setWeightInput(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="VD: 2.5"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Phân loại chất lượng
                </label>
                <select
                  value={qualityInput}
                  onChange={(e) => setQualityInput(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Loại 1">Loại 1</option>
                  <option value="Đạt chuẩn">Đạt chuẩn</option>
                  <option value="Loại 2">Loại 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Ghi chú thu hoạch
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="VD: Nấm đẹp, đã bàn giao..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={resetToEmpty}
                onChange={(e) => setResetToEmpty(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Hoàn tất chu kỳ và trả khay về trạng thái <strong>Trống</strong>{' '}
                sau khi thu hoạch
              </span>
            </label>

            {formError && (
              <p className="text-xs text-red-600 font-medium">{formError}</p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition cursor-pointer"
              >
                Xác nhận thu hoạch
              </button>
            </div>
          </form>
        )}
      </section>

      {/* LỊCH SỬ THU HOẠCH */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Lịch sử thu hoạch
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Danh sách các đợt thu hoạch đã ghi nhận trong hệ thống
            </p>
          </div>

          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
            {records.length} phiếu thu hoạch
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Khay / Phòng</th>
                <th className="py-3 px-4">Loại nấm</th>
                <th className="py-3 px-4">Bên thuê</th>
                <th className="py-3 px-4">Sản lượng</th>
                <th className="py-3 px-4">Chất lượng</th>
                <th className="py-3 px-4">Ngày thu</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {rec.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">
                      {rec.trayId}
                    </div>
                    <div className="text-xs text-gray-500">{rec.roomCode}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{rec.mushroom}</td>
                  <td className="py-3 px-4 text-gray-600">{rec.renter}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">
                    {rec.weightKg} kg
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        QUALITY_BADGE[rec.quality] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rec.quality}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="text-gray-700">{rec.harvestedAt}</div>
                    <div className="text-xs text-gray-400">{rec.note}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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