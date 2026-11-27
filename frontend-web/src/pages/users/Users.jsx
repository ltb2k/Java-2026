import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

const ROLE_BADGE = {
  ADMIN: 'bg-purple-100 text-purple-700',
  OPERATOR: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-emerald-100 text-emerald-700',
};

export default function Users({ currentRole }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.users.list({ search: search.trim() || undefined, limit: 100 });
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (currentRole === 'Admin') {
      loadUsers();
    }
  }, [currentRole, loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.users.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setIsAdding(false);
      setForm({ full_name: '', email: '', password: '', role: 'OPERATOR' });
      setSuccessMsg('Đã tạo tài khoản mới.');
      await loadUsers();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async (u) => {
    const nextActive = !u.is_active;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.users.update(u.id, {
        is_active: nextActive,
        status: nextActive ? 'ACTIVE' : 'DISABLED',
      });
      setSuccessMsg(`Đã cập nhật trạng thái tài khoản ${u.email}.`);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (u) => {
    const newPass = window.prompt(`Nhập mật khẩu mới cho ${u.email} (tối thiểu 6 ký tự):`);
    if (!newPass) return;
    setBusy(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.users.resetPassword(u.id, newPass);
      setSuccessMsg(`Đã đặt lại mật khẩu cho ${u.email}.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (currentRole !== 'Admin') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-red-600">
        Chỉ tài khoản Admin mới có quyền quản lý người dùng.
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

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsAdding((v) => !v)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            + Tạo tài khoản
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreateUser} className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Họ tên"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu (>=6 ký tự)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white"
            >
              <option value="OPERATOR">OPERATOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
            >
              Lưu tài khoản
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Đang tải danh sách tài khoản...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.is_active ? (
                        <span className="text-emerald-700 font-medium">{u.status}</span>
                      ) : (
                        <span className="text-red-600 font-medium">{u.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggleStatus(u)}
                        className="text-xs text-blue-600 hover:underline cursor-pointer"
                      >
                        {u.is_active ? 'Khóa' : 'Mở khóa'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleResetPassword(u)}
                        className="text-xs text-amber-600 hover:underline cursor-pointer"
                      >
                        Đặt lại MK
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
