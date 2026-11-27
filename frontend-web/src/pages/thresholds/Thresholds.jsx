import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const METRIC_LABELS = {
  TEMPERATURE: { label: 'Nhiệt độ', unit: '°C' },
  HUMIDITY: { label: 'Độ ẩm không khí', unit: '%' },
  CO2: { label: 'Nồng độ CO₂', unit: 'ppm' },
};

export default function Thresholds({ thresholds = [], alerts = [], onRefresh }) {
  const [forms, setForms] = useState({});
  const [busyMetric, setBusyMetric] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const map = {};
    (thresholds || []).forEach((t) => {
      map[t.metric] = {
        lower_bound: t.lower_bound ?? 0,
        upper_bound: t.upper_bound ?? 100,
        unit: t.unit || METRIC_LABELS[t.metric]?.unit || '',
      };
    });
    setForms(map);
  }, [thresholds]);

  const handleSave = async (metric) => {
    const item = forms[metric];
    if (!item) return;
    if (Number(item.lower_bound) >= Number(item.upper_bound)) {
      setErrorMsg(`Ngưỡng dưới phải nhỏ hơn ngưỡng trên cho chỉ số ${metric}.`);
      return;
    }

    setBusyMetric(metric);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.alerts.updateThreshold(metric, {
        lower_bound: Number(item.lower_bound),
        upper_bound: Number(item.upper_bound),
        unit: item.unit,
      });
      setSuccessMsg(`Đã cập nhật ngưỡng ${METRIC_LABELS[metric]?.label || metric}.`);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusyMetric(null);
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

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Cấu hình ngưỡng cảnh báo môi trường
        </h3>
        {thresholds.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có cấu hình ngưỡng trong cơ sở dữ liệu.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {thresholds.map((t) => {
              const form = forms[t.metric] || {};
              const meta = METRIC_LABELS[t.metric] || { label: t.metric, unit: t.unit };
              return (
                <div key={t.metric} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-800">{meta.label}</h4>
                    <span className="text-xs text-gray-500">{form.unit || meta.unit}</span>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ngưỡng dưới</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.lower_bound ?? ''}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [t.metric]: { ...prev[t.metric], lower_bound: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Ngưỡng trên</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.upper_bound ?? ''}
                      onChange={(e) =>
                        setForms((prev) => ({
                          ...prev,
                          [t.metric]: { ...prev[t.metric], upper_bound: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busyMetric === t.metric}
                    onClick={() => handleSave(t.metric)}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {busyMetric === t.metric ? 'Đang lưu...' : 'Lưu ngưỡng'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          Cảnh báo vượt ngưỡng gần đây ({alerts.length})
        </h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-500">Không có cảnh báo nào.</p>
        ) : (
          <div className="divide-y divide-gray-100 text-sm">
            {alerts.slice(0, 15).map((al) => (
              <div key={al.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-800">
                    [{al.severity}] {al.title}
                  </p>
                  <p className="text-xs text-gray-500">{al.message}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
                  {al.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
