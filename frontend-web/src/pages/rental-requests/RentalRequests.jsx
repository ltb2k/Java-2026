import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_BADGE = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
  COMPLETED: 'bg-purple-100 text-purple-700',
};

export default function RentalRequests({ trays = [], onRefresh }) {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [assignModal, setAssignModal] = useState(null);
  const [selectedTrayIds, setSelectedTrayIds] = useState([]);

  const loadRentals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.rentals.list();
      setRentals(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  const handleApprove = async (r) => {
    setBusyId(`app-${r.id}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.rentals.approve(r.id);
      setSuccessMsg(`Đã duyệt yêu cầu thuê #${r.id}.`);
      await loadRentals();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (r) => {
    const reason = window.prompt('Nhập lý do từ chối yêu cầu thuê:');
    if (reason === null) return;
    setBusyId(`rej-${r.id}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.rentals.reject(r.id, reason || 'Không đủ điều kiện');
      setSuccessMsg(`Đã từ chối yêu cầu thuê #${r.id}.`);
      await loadRentals();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModal || selectedTrayIds.length === 0) return;
    setBusyId(`ass-${assignModal.id}`);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.rentals.assignTrays(assignModal.id, selectedTrayIds);
      setAssignModal(null);
      setSelectedTrayIds([]);
      setSuccessMsg(`Đã phân bổ khay cho hợp đồng #${assignModal.id}.`);
      await loadRentals();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const availableTrays = trays.filter((t) => t.status === 'AVAILABLE');

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

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">
            Danh sách hợp đồng & yêu cầu thuê ({rentals.length})
          </h3>
          <button
            type="button"
            onClick={loadRentals}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            Tải lại
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải danh sách thuê...</p>
        ) : rentals.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Chưa có yêu cầu thuê nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Gói thuê</th>
                  <th className="px-4 py-3">SL</th>
                  <th className="px-4 py-3">Khay đã gán</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.customer_name}</p>
                      <p className="text-xs text-gray-500">{r.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.package_name} ({r.duration_days} ngày)
                    </td>
                    <td className="px-4 py-3">{r.quantity}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {r.trays?.length > 0
                        ? r.trays.map((t) => t.code).join(', ')
                        : r.active_link_code
                        ? `Mã link: ${r.active_link_code}`
                        : 'Chưa gán'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[r.status] || 'bg-gray-100'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === `app-${r.id}`}
                            onClick={() => handleApprove(r)}
                            className="text-xs px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            disabled={busyId === `rej-${r.id}`}
                            onClick={() => handleReject(r)}
                            className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssignModal(r);
                            setSelectedTrayIds([]);
                          }}
                          className="text-xs px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                        >
                          Gán khay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-800">
              Gán khay cho hợp đồng #{assignModal.id} (Cần {assignModal.quantity} khay)
            </h3>
            {availableTrays.length === 0 ? (
              <p className="text-xs text-red-600">Không còn khay trống (AVAILABLE) nào.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {availableTrays.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTrayIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTrayIds((prev) => [...prev, t.id]);
                        } else {
                          setSelectedTrayIds((prev) => prev.filter((id) => id !== t.id));
                        }
                      }}
                    />
                    <span className="font-semibold">{t.code}</span> — {t.room_name} ({t.mushroom_variety})
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={selectedTrayIds.length === 0 || busyId === `ass-${assignModal.id}`}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Xác nhận gán khay
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
