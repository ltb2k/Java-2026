import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const STAGES = [
  'PREPARATION',
  'INCUBATION',
  'FRUITING',
  'READY_TO_HARVEST',
  'HARVESTED',
  'COMPLETED',
];

const STAGE_LABELS = {
  PREPARATION: 'Chuẩn bị phôi',
  INCUBATION: 'Ươm tơ',
  FRUITING: 'Ra quả thể',
  READY_TO_HARVEST: 'Sẵn sàng thu hoạch',
  HARVESTED: 'Đã thu hoạch',
  COMPLETED: 'Hoàn tất chu kỳ',
};

export default function GrowthTracking({ trays = [], onRefresh }) {
  const [selectedTrayId, setSelectedTrayId] = useState(trays[0]?.id ?? null);
  const [logs, setLogs] = useState([]);
  const [stage, setStage] = useState('INCUBATION');
  const [notes, setNotes] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (trays.length > 0 && !trays.some((t) => t.id === selectedTrayId)) {
      setSelectedTrayId(trays[0].id);
    }
  }, [trays, selectedTrayId]);

  const selectedTray = trays.find((t) => t.id === selectedTrayId) || null;

  useEffect(() => {
    if (!selectedTrayId) {
      setLogs([]);
      return;
    }
    if (selectedTray?.growth_stage) {
      setStage(selectedTray.growth_stage);
    }
    setLoadingLogs(true);
    api.trays
      .growthLogs(selectedTrayId)
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoadingLogs(false));
  }, [selectedTrayId, selectedTray?.growth_stage]);

  const handleUpdateStage = async (e) => {
    e.preventDefault();
    if (!selectedTrayId) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.trays.updateStage(selectedTrayId, { stage, notes: notes.trim() || null });
      setNotes('');
      setSuccessMsg(`Đã cập nhật giai đoạn sang "${STAGE_LABELS[stage] || stage}".`);
      const updatedLogs = await api.trays.growthLogs(selectedTrayId);
      setLogs(Array.isArray(updatedLogs) ? updatedLogs : []);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            Chọn khay nấm ({trays.length})
          </h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {trays.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTrayId(t.id)}
                className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                  t.id === selectedTrayId
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm text-gray-800">{t.code}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {STAGE_LABELS[t.growth_stage] || t.growth_stage}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t.room_name || `Phòng #${t.room_id}`} • {t.mushroom_variety || 'Nấm'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedTray ? (
            <>
              <form
                onSubmit={handleUpdateStage}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4"
              >
                <h3 className="text-base font-semibold text-gray-800">
                  Cập nhật giai đoạn sinh trưởng — {selectedTray.code}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Giai đoạn mới
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]} ({s})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Ghi chú tiến trình
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="VD: Tơ nấm phát triển đều, độ ẩm ổn định"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {busy ? 'Đang cập nhật...' : 'Cập nhật giai đoạn'}
                </button>
              </form>

              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Nhật ký sinh trưởng ({logs.length})
                </h3>
                {loadingLogs ? (
                  <p className="text-xs text-gray-500">Đang tải nhật ký...</p>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-gray-500">Chưa có nhật ký chuyển giai đoạn cho khay này.</p>
                ) : (
                  <div className="divide-y divide-gray-100 text-sm">
                    {logs.map((log) => (
                      <div key={log.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">
                            {log.previous_stage || '—'} → {log.new_stage}
                          </span>
                          <span className="text-xs text-gray-400">
                            {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                          </span>
                        </div>
                        {log.notes && <p className="text-xs text-gray-600 mt-1">{log.notes}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Người cập nhật: {log.updated_by_name || 'Hệ thống'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
              Chọn một khay nấm để xem và cập nhật tiến trình sinh trưởng.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
