import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

const formatCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`;

export default function Packages({ currentRole }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [form, setForm] = useState({
    name: '',
    duration_days: 30,
    price: 350000,
    description: '',
    status: 'ACTIVE',
  });

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.packages.list();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        name: form.name.trim(),
        duration_days: Number(form.duration_days),
        price: Number(form.price),
        description: form.description.trim() || null,
        status: form.status,
      };
      if (editingPkg) {
        await api.packages.update(editingPkg.id, payload);
        setSuccessMsg(`Đã cập nhật gói "${payload.name}".`);
      } else {
        await api.packages.create(payload);
        setSuccessMsg(`Đã tạo gói "${payload.name}".`);
      }
      setIsModalOpen(false);
      await loadPackages();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Xóa hoặc ngưng áp dụng gói "${pkg.name}"?`)) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.packages.remove(pkg.id);
      setSuccessMsg(`Đã xử lý gói "${pkg.name}".`);
      await loadPackages();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (currentRole !== 'Admin') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-red-600">
        Chỉ tài khoản Admin mới có quyền quản lý gói thuê.
      </div>
    );
  }

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

      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-gray-800">
          Danh sách gói thuê ({packages.length})
        </h3>
        <button
          type="button"
          onClick={() => {
            setEditingPkg(null);
            setForm({
              name: '',
              duration_days: 30,
              price: 350000,
              description: '',
              status: 'ACTIVE',
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
        >
          + Thêm gói thuê
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải gói thuê...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-gray-800 text-sm">{pkg.name}</h4>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${pkg.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                    {pkg.status}
                  </span>
                </div>
                <p className="text-xl font-bold text-emerald-600 mt-2">
                  {formatCurrency(pkg.price)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Thời hạn: {pkg.duration_days} ngày</p>
                <p className="text-xs text-gray-600 mt-3">{pkg.description || 'Không có mô tả'}</p>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPkg(pkg);
                    setForm({
                      name: pkg.name || '',
                      duration_days: pkg.duration_days || 30,
                      price: pkg.price || 0,
                      description: pkg.description || '',
                      status: pkg.status || 'ACTIVE',
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium cursor-pointer"
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(pkg)}
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-800">
              {editingPkg ? 'Cập nhật gói thuê' : 'Thêm gói thuê mới'}
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tên gói</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Số ngày</label>
                <input
                  type="number"
                  min="1"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                Lưu gói thuê
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
