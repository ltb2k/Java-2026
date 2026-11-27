import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

const STATUS_BADGE = {
  PLANNED: 'bg-blue-100 text-blue-700',
  RECORDED: 'bg-emerald-100 text-emerald-700',
};

export default function Harvest({ trays = [], onRefresh }) {
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [planForm, setPlanForm] = useState({
    tray_id: trays[0]?.id ?? '',
    planned_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [recordingHarvest, setRecordingHarvest] = useState(null);
  const [recordForm, setRecordForm] = useState({
    quantity_kg: '',
    quality_grade: 'Loại 1',
    harvest_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadHarvests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.harvests.list();
      setHarvests(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHarvests();
  }, [loadHarvests]);

  useEffect(() => {
    if (trays.length > 0 && !planForm.tray_id) {
      setPlanForm((p) => ({ ...p, tray_id: trays[0].id }));
    }
  }, [trays, planForm.tray_id]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planForm.tray_id) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.harvests.create({
        tray_id: Number(planForm.tray_id),
        planned_date: planForm.planned_date || null,
        notes: planForm.notes.trim() || null,
      });
      setPlanForm((p) => ({ ...p, notes: '' }));
      setSuccessMsg('Đã tạo kế hoạch thu hoạch mới.');
      await loadHarvests();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordingHarvest) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.harvests.record(recordingHarvest.id, {
        quantity_kg: Number(recordForm.quantity_kg),
        quality_grade: recordForm.quality_grade,
        harvest_date: recordForm.harvest_date || null,
        notes: recordForm.notes.trim() || null,
      });
      setRecordingHarvest(null);
      setSuccessMsg(`Đã ghi nhận sản lượng thu hoạch #${recordingHarvest.id}.`);
      await loadHarvests();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const totalKg = harvests.reduce((s, h) => s + Number(h.quantity_kg || 0), 0);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tổng lượt thu hoạch</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{harvests.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Đang lập kế hoạch</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {harvests.filter((h) => h.status === 'PLANNED').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Tổng sản lượng đã ghi nhận</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalKg.toFixed(2)} kg</p>
        </div>
      </div>

      <form
        onSubmit={handleCreatePlan}
        className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Khay nấm</label>
          <select
            value={planForm.tray_id}
            onChange={(e) => setPlanForm({ ...planForm, tray_id: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            required
          >
            {trays.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} ({t.room_name || `#${t.room_id}`})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ngày dự kiến</label>
          <input
            type="date"
            value={planForm.planned_date}
            onChange={(e) => setPlanForm({ ...planForm, planned_date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
          <input
            type="text"
            placeholder="Ghi chú kế hoạch..."
            value={planForm.notes}
            onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
        >
          + Lập kế hoạch thu hoạch
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          Lịch sử & Kế hoạch thu hoạch
        </h3>
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        ) : harvests.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Chưa có bản ghi thu hoạch nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Khay / Phòng</th>
                  <th className="px-4 py-3">Ngày dự kiến</th>
                  <th className="px-4 py-3">Ngày thu hoạch</th>
                  <th className="px-4 py-3">Sản lượng (kg)</th>
                  <th className="px-4 py-3">Chất lượng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {harvests.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{h.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {h.tray_code || `#${h.tray_id}`} • {h.room_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{h.planned_date || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{h.harvest_date || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {h.quantity_kg != null ? `${h.quantity_kg} kg` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{h.quality_grade || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[h.status] || 'bg-gray-100'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {h.status === 'PLANNED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingHarvest(h);
                            setRecordForm({
                              quantity_kg: '',
                              quality_grade: 'Loại 1',
                              harvest_date: new Date().toISOString().slice(0, 10),
                              notes: h.notes || '',
                            });
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Ghi nhận sản lượng
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

      {recordingHarvest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleRecordSubmit}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-800">
              Ghi nhận thu hoạch — Khay {recordingHarvest.tray_code}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sản lượng (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={recordForm.quantity_kg}
                onChange={(e) => setRecordForm({ ...recordForm, quantity_kg: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Chất lượng</label>
                <select
                  value={recordForm.quality_grade}
                  onChange={(e) => setRecordForm({ ...recordForm, quality_grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                >
                  <option value="Loại 1">Loại 1</option>
                  <option value="Đạt chuẩn">Đạt chuẩn</option>
                  <option value="Loại 2">Loại 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ngày thu hoạch</label>
                <input
                  type="date"
                  value={recordForm.harvest_date}
                  onChange={(e) => setRecordForm({ ...recordForm, harvest_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
              <input
                type="text"
                value={recordForm.notes}
                onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecordingHarvest(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                Lưu sản lượng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
