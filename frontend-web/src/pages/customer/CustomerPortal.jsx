import React, { useMemo, useState } from 'react';

const INITIAL_CUSTOMER_REQUESTS = [
  {
    id: 'REQ-201',
    packageName: 'Gói Trải Nghiệm Bào Ngư 30 Ngày',
    mushroomType: 'Nấm Bào Ngư',
    trayCount: 1,
    durationDays: 30,
    totalPrice: 350000,
    status: 'Đang nuôi trồng',
    trayCode: 'T-B01',
    roomName: 'Phòng Nấm Bào Ngư - Khu B',
    day: 15,
  },
];

const formatCurrency = (amount) =>
  `${Number(amount || 0).toLocaleString('vi-VN')} đ`;

export default function CustomerPortal({
  currentUser,
  packages = [],
  onLogout,
}) {
  const activePackages = useMemo(
    () => packages.filter((p) => p.status === 'Đang áp dụng'),
    [packages]
  );

  const [selectedPackageId, setSelectedPackageId] = useState(
    activePackages[0]?.id || ''
  );
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState(INITIAL_CUSTOMER_REQUESTS);
  const [feedback, setFeedback] = useState('');

  const selectedPackage = useMemo(
    () =>
      activePackages.find((p) => p.id === selectedPackageId) ||
      activePackages[0] ||
      null,
    [activePackages, selectedPackageId]
  );

  const handleSubmitRental = (e) => {
    e.preventDefault();
    if (!selectedPackage) return;

    const newReq = {
      id: `REQ-${Date.now().toString().slice(-3)}`,
      packageName: selectedPackage.name,
      mushroomType: selectedPackage.mushroomType,
      trayCount: selectedPackage.trayCount,
      durationDays: selectedPackage.durationDays,
      totalPrice: selectedPackage.price,
      status: 'Chờ duyệt',
      trayCode: 'Chờ phân bổ',
      roomName: 'Chờ xếp phòng',
      day: 0,
      note: note.trim(),
    };

    setRequests((prev) => [newReq, ...prev]);
    setNote('');
    setFeedback(
      `Đã gửi yêu cầu thuê "${selectedPackage.name}" (${newReq.id}). Vận hành sẽ xử lý và phân bổ khay sớm nhất.`
    );
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
              Xin chào <strong>{currentUser?.fullName}</strong> • Vai trò:{' '}
              <span className="font-semibold text-emerald-700">Customer</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
        >
          Đăng xuất
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-sm text-emerald-800 font-medium">{feedback}</p>
          </div>
        )}

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Gói thuê khay đang mở đăng ký
            </h2>
            <p className="text-sm text-gray-500">
              Chọn gói phù hợp để gửi yêu cầu thuê khay nấm
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePackages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {pkg.mushroomType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {pkg.durationDays} ngày • {pkg.trayCount} khay
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-base font-bold text-emerald-700">
                      {formatCurrency(pkg.price)}
                    </span>
                    <span className="text-xs font-medium text-emerald-700">
                      {isSelected ? '✓ Đang chọn' : 'Chọn gói'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {selectedPackage && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800">
              Gửi yêu cầu thuê — {selectedPackage.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chi phí dự kiến:{' '}
              <strong className="text-emerald-700">
                {formatCurrency(selectedPackage.price)}
              </strong>{' '}
              • Chu kỳ {selectedPackage.durationDays} ngày •{' '}
              {selectedPackage.trayCount} khay
            </p>

            <form
              onSubmit={handleSubmitRental}
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm (VD: ưu tiên giao nhận cuối tuần)..."
                className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
              >
                Gửi yêu cầu thuê
              </button>
            </form>
          </section>
        )}

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Đơn thuê & Khay của tôi
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Theo dõi trạng thái duyệt đơn và tiến độ khay nuôi
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-4">Gói thuê</th>
                  <th className="py-3 px-4">Khay / Phòng</th>
                  <th className="py-3 px-4">Ngày nuôi</th>
                  <th className="py-3 px-4">Chi phí</th>
                  <th className="py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {req.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">
                        {req.packageName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {req.mushroomType} • {req.trayCount} khay
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">
                      <div>{req.trayCode}</div>
                      <div className="text-gray-500">{req.roomName}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      Ngày {req.day}/{req.durationDays}
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {formatCurrency(req.totalPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}