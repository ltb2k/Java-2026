import React, { useEffect, useMemo, useState } from 'react';

const INITIAL_RENTAL_REQUESTS = [
  {
    id: 'REQ-2026-01',
    renterName: 'Nguyễn Minh Khoa',
    renterCode: 'Khách thuê #120',
    phone: '0901 234 567',
    mushroom: 'Nấm Linh Chi',
    trayCount: 2,
    durationDays: 45,
    packageName: 'Gói Nuôi 45 Ngày - Linh Chi',
    totalFee: '2.400.000đ',
    createdAt: '20/11/2026 08:30',
    status: 'Chờ duyệt',
    note: 'Ưu tiên khay gần khu cảm biến nhiệt độ ổn định.',
    rejectReason: '',
    assignedRoomId: null,
    assignedRoomCode: '',
    assignedTrayIds: [],
  },
  {
    id: 'REQ-2026-02',
    renterName: 'Trần Thu Hà',
    renterCode: 'Khách thuê #121',
    phone: '0912 345 678',
    mushroom: 'Nấm Bào Ngư',
    trayCount: 1,
    durationDays: 30,
    packageName: 'Gói Nuôi 30 Ngày - Bào Ngư',
    totalFee: '1.100.000đ',
    createdAt: '19/11/2026 16:15',
    status: 'Chờ duyệt',
    note: 'Nhận khay sớm trong ngày nếu có khay trống.',
    rejectReason: '',
    assignedRoomId: null,
    assignedRoomCode: '',
    assignedTrayIds: [],
  },
  {
    id: 'REQ-2026-03',
    renterName: 'Lê Hoàng Nam',
    renterCode: 'Khách thuê #102',
    phone: '0987 654 321',
    mushroom: 'Nấm Linh Chi',
    trayCount: 1,
    durationDays: 45,
    packageName: 'Gói Nuôi 45 Ngày - Linh Chi',
    totalFee: '1.250.000đ',
    createdAt: '29/10/2026 10:00',
    status: 'Đã duyệt',
    note: '',
    rejectReason: '',
    assignedRoomId: 1,
    assignedRoomCode: 'ROOM-A1',
    assignedTrayIds: ['T-A01'],
  },
  {
    id: 'REQ-2026-04',
    renterName: 'Phạm Gia Huy',
    renterCode: 'Khách thuê #122',
    phone: '0933 111 222',
    mushroom: 'Nấm Bào Ngư',
    trayCount: 5,
    durationDays: 30,
    packageName: 'Gói Nuôi 30 Ngày - Bào Ngư',
    totalFee: '5.200.000đ',
    createdAt: '18/11/2026 14:20',
    status: 'Từ chối',
    note: '',
    rejectReason: 'Số lượng khay trống phù hợp loại nấm hiện không đủ 5 khay.',
    assignedRoomId: null,
    assignedRoomCode: '',
    assignedTrayIds: [],
  },
];

const REQUEST_STATUS_BADGE = {
  'Chờ duyệt': 'bg-amber-100 text-amber-700',
  'Đã duyệt': 'bg-emerald-100 text-emerald-700',
  'Từ chối': 'bg-red-100 text-red-700',
};

const REQUEST_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'Chờ duyệt', label: 'Chờ duyệt' },
  { value: 'Đã duyệt', label: 'Đã duyệt' },
  { value: 'Từ chối', label: 'Từ chối' },
];

export default function RentalRequests({ rooms = [], setRooms }) {
  const [requests, setRequests] = useState(INITIAL_RENTAL_REQUESTS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(
    INITIAL_RENTAL_REQUESTS[0].id
  );

  // State cho phân bổ phòng & khay trống khi duyệt
  const [allocRoomId, setAllocRoomId] = useState(rooms[0]?.id ?? '');
  const [selectedTrayIds, setSelectedTrayIds] = useState([]);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (!allocRoomId && rooms.length > 0) {
      setAllocRoomId(rooms[0].id);
    }
  }, [rooms, allocRoomId]);

  const selectedRequest =
    requests.find((req) => req.id === selectedRequestId) ?? null;

  const allocationRoom =
    rooms.find((room) => room.id === Number(allocRoomId)) ?? null;

  const emptyTraysInRoom = useMemo(() => {
    if (!allocationRoom) return [];
    return allocationRoom.trays.filter((tray) => tray.status === 'Trống');
  }, [allocationRoom]);

  const statistics = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'Chờ duyệt').length,
      approved: requests.filter((r) => r.status === 'Đã duyệt').length,
      rejected: requests.filter((r) => r.status === 'Từ chối').length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesStatus =
        statusFilter === 'ALL' || req.status === statusFilter;

      const keyword = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        req.id.toLowerCase().includes(keyword) ||
        req.renterName.toLowerCase().includes(keyword) ||
        req.renterCode.toLowerCase().includes(keyword) ||
        req.mushroom.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchTerm]);

  const handleSelectRequest = (req) => {
    setSelectedRequestId(req.id);
    setActionError('');
    setFeedbackMessage('');
    setRejectReasonInput(req.rejectReason || '');

    const matchedRoom =
      rooms.find(
        (r) => r.mushroom.toLowerCase() === req.mushroom.toLowerCase()
      ) || rooms[0];
    setAllocRoomId(matchedRoom ? matchedRoom.id : '');
    setSelectedTrayIds([]);
  };

  const handleChangeAllocRoom = (roomId) => {
    setAllocRoomId(Number(roomId));
    setSelectedTrayIds([]);
    setActionError('');
  };

  const handleToggleTraySelection = (trayId) => {
    if (!selectedRequest) return;
    setActionError('');

    setSelectedTrayIds((prev) => {
      if (prev.includes(trayId)) {
        return prev.filter((id) => id !== trayId);
      }
      if (prev.length >= selectedRequest.trayCount) {
        setActionError(
          `Đơn này chỉ yêu cầu tối đa ${selectedRequest.trayCount} khay.`
        );
        return prev;
      }
      return [...prev, trayId];
    });
  };

  const handleApproveRequest = () => {
    if (!selectedRequest || selectedRequest.status !== 'Chờ duyệt') return;

    if (!allocationRoom) {
      setActionError('Vui lòng chọn phòng nuôi để phân bổ khay.');
      return;
    }

    if (selectedTrayIds.length !== selectedRequest.trayCount) {
      setActionError(
        `Vui lòng chọn đủ ${selectedRequest.trayCount} khay trống (đang chọn ${selectedTrayIds.length}/${selectedRequest.trayCount}).`
      );
      return;
    }

    const stillEmptyCount = emptyTraysInRoom.filter((t) =>
      selectedTrayIds.includes(t.id)
    ).length;
    if (stillEmptyCount !== selectedRequest.trayCount) {
      setActionError('Một số khay đã được sử dụng, vui lòng chọn lại.');
      setSelectedTrayIds([]);
      return;
    }

    if (typeof setRooms === 'function') {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id !== allocationRoom.id) return room;

          return {
            ...room,
            trays: room.trays.map((tray) => {
              if (!selectedTrayIds.includes(tray.id)) return tray;
              return {
                ...tray,
                mushroom: selectedRequest.mushroom,
                day: 1,
                status: 'Đang nuôi',
                renter: `${selectedRequest.renterCode} (${selectedRequest.renterName})`,
              };
            }),
          };
        })
      );
    }

    setRequests((prevRequests) =>
      prevRequests.map((req) => {
        if (req.id !== selectedRequest.id) return req;
        return {
          ...req,
          status: 'Đã duyệt',
          rejectReason: '',
          assignedRoomId: allocationRoom.id,
          assignedRoomCode: allocationRoom.code,
          assignedTrayIds: selectedTrayIds,
        };
      })
    );

    setActionError('');
    setSelectedTrayIds([]);
    setFeedbackMessage(
      `Đã duyệt đơn ${selectedRequest.id} và phân bổ khay ${selectedTrayIds.join(', ')} tại phòng ${allocationRoom.code}.`
    );
  };

  const handleRejectRequest = () => {
    if (!selectedRequest || selectedRequest.status !== 'Chờ duyệt') return;

    const reason = rejectReasonInput.trim();
    if (!reason) {
      setActionError('Vui lòng nhập lý do từ chối yêu cầu thuê.');
      return;
    }

    setRequests((prevRequests) =>
      prevRequests.map((req) => {
        if (req.id !== selectedRequest.id) return req;
        return {
          ...req,
          status: 'Từ chối',
          rejectReason: reason,
        };
      })
    );

    setActionError('');
    setSelectedTrayIds([]);
    setFeedbackMessage(`Đã từ chối yêu cầu thuê ${selectedRequest.id}.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Dữ liệu phòng & khay đang dùng chung từ{' '}
          <code>App.jsx</code>. Khi duyệt đơn và gán khay trống, trạng thái đơn
          và khay sẽ cập nhật trực tiếp và đồng bộ với trang{' '}
          <strong>Phòng & Khay</strong>.
        </p>
      </div>

      {/* THỐNG KÊ */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tổng quan yêu cầu thuê khay
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi đơn thuê mới, phân bổ khay trống và trạng thái hợp đồng
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Tổng yêu cầu"
            value={statistics.total}
            description="Tất cả đơn thuê"
            color="text-gray-800"
          />
          <StatCard
            title="Chờ duyệt"
            value={statistics.pending}
            description="Cần phân bổ khay"
            color="text-amber-600"
          />
          <StatCard
            title="Đã duyệt"
            value={statistics.approved}
            description="Đã gán khay & bắt đầu"
            color="text-emerald-600"
          />
          <StatCard
            title="Từ chối"
            value={statistics.rejected}
            description="Không đủ điều kiện / khay"
            color="text-red-600"
          />
        </div>
      </section>

      {/* DANH SÁCH & BỘ LỌC */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Danh sách yêu cầu thuê
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Chọn một yêu cầu để xem chi tiết, chọn phòng/khay trống hoặc từ
                chối
              </p>
            </div>

            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              Hiển thị {filteredRequests.length}/{requests.length} yêu cầu
            </span>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đơn, tên/mã khách thuê hoặc loại nấm..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {REQUEST_FILTER_OPTIONS.map((filter) => (
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
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Khách thuê</th>
                <th className="py-3 px-4">Loại nấm</th>
                <th className="py-3 px-4">Số khay</th>
                <th className="py-3 px-4">Thời hạn</th>
                <th className="py-3 px-4">Khay đã gán</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredRequests.map((req) => {
                const isSelected = req.id === selectedRequestId;

                return (
                  <tr
                    key={req.id}
                    className={`transition ${
                      isSelected ? 'bg-emerald-50/40' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {req.id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">
                        {req.renterName}
                      </p>
                      <p className="text-xs text-gray-500">{req.renterCode}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{req.mushroom}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {req.trayCount} khay
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {req.durationDays} ngày
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {req.assignedTrayIds.length > 0
                        ? `${req.assignedRoomCode}: ${req.assignedTrayIds.join(', ')}`
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          REQUEST_STATUS_BADGE[req.status]
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectRequest(req)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        {req.status === 'Chờ duyệt' ? 'Duyệt / Xử lý' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-gray-500">
                    Không có yêu cầu thuê nào khớp bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedRequest && (
          <div className="border-t border-gray-100 p-5 space-y-5">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-semibold text-gray-800">
                    Chi tiết yêu cầu {selectedRequest.id}
                  </h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      REQUEST_STATUS_BADGE[selectedRequest.status]
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tạo lúc: {selectedRequest.createdAt} • Gói:{' '}
                  {selectedRequest.packageName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequestId(null)}
                className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {feedbackMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <p className="text-sm text-emerald-800 font-medium">
                  {feedbackMessage}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <InfoBox
                label="Khách thuê"
                value={`${selectedRequest.renterName} (${selectedRequest.phone})`}
              />
              <InfoBox
                label="Loại nấm & Số lượng"
                value={`${selectedRequest.mushroom} • ${selectedRequest.trayCount} khay`}
              />
              <InfoBox
                label="Thời hạn & Chi phí"
                value={`${selectedRequest.durationDays} ngày • ${selectedRequest.totalFee}`}
              />
              <InfoBox
                label="Phân bổ hiện tại"
                value={
                  selectedRequest.assignedTrayIds.length > 0
                    ? `${selectedRequest.assignedRoomCode} (${selectedRequest.assignedTrayIds.join(', ')})`
                    : selectedRequest.status === 'Từ chối'
                      ? `Từ chối: ${selectedRequest.rejectReason}`
                      : 'Chưa phân bổ khay'
                }
              />
            </div>

            {selectedRequest.note && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Ghi chú từ khách thuê</p>
                <p className="text-sm text-gray-700 mt-1">
                  {selectedRequest.note}
                </p>
              </div>
            )}

            {selectedRequest.status === 'Chờ duyệt' && (
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">
                    Phân bổ phòng & khay trống (Cần chọn{' '}
                    {selectedRequest.trayCount} khay)
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Chỉ hiển thị các khay đang ở trạng thái Trống trong phòng
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Chọn phòng nuôi
                  </label>
                  <select
                    value={allocRoomId}
                    onChange={(e) => handleChangeAllocRoom(e.target.value)}
                    className="w-full sm:w-96 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {rooms.map((room) => {
                      const emptyCount = room.trays.filter(
                        (t) => t.status === 'Trống'
                      ).length;
                      return (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.code}) — {emptyCount} khay trống
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Khay trống khả dụng (Đã chọn {selectedTrayIds.length}/
                    {selectedRequest.trayCount}):
                  </p>

                  {emptyTraysInRoom.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {emptyTraysInRoom.map((tray) => {
                        const isPicked = selectedTrayIds.includes(tray.id);
                        return (
                          <button
                            key={tray.id}
                            type="button"
                            onClick={() => handleToggleTraySelection(tray.id)}
                            className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                              isPicked
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                            }`}
                          >
                            {tray.id} (Trống)
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Phòng này hiện không còn khay trống. Hãy đổi sang phòng
                      khác hoặc từ chối đơn.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Lý do từ chối (bắt buộc nếu bấm Từ chối)
                  </label>
                  <input
                    type="text"
                    value={rejectReasonInput}
                    onChange={(e) => {
                      setRejectReasonInput(e.target.value);
                      if (actionError) setActionError('');
                    }}
                    placeholder="VD: Hết khay trống phù hợp loại nấm trong thời gian yêu cầu..."
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {actionError && (
                  <p className="text-xs text-red-600 font-medium">
                    {actionError}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRejectRequest}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                  >
                    Từ chối yêu cầu
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveRequest}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                  >
                    Duyệt & Phân bổ khay
                  </button>
                </div>
              </div>
            )}
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

function InfoBox({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  );
}