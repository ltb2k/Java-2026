import React, { useState } from 'react';
import api, { saveAuthSession } from '../../services/api';

const QUICK_LOGIN_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@mushroom.local',
    password: 'Admin@123456',
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    role: 'Operator',
    email: 'operator@mushroom.local',
    password: 'Operator@123456',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    role: 'Customer',
    email: 'customer@mushroom.local',
    password: 'Customer@123456',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
];

export default function AuthPage({
  onLoginSuccess,
  initialNotice = '',
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [quickLoadingRole, setQuickLoadingRole] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(initialNotice);

  const performLogin = async (loginEmail, loginPassword, roleLabel = '') => {
    setLoading(true);
    setQuickLoadingRole(roleLabel);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const data = await api.auth.login(loginEmail, loginPassword);
      saveAuthSession(data);
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
      setQuickLoadingRole('');
    }
  };

  const handleQuickLogin = async (acc) => {
    if (loading) return;
    setEmail(acc.email);
    setPassword(acc.password);
    await performLogin(acc.email, acc.password, acc.role);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password;

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    await performLogin(cleanEmail, cleanPass);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, email và mật khẩu.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      await api.auth.register(fullName.trim(), regEmail.trim(), regPassword);
      const loginRes = await api.auth.login(regEmail.trim(), regPassword);
      saveAuthSession(loginRes);
      onLoginSuccess(loginRes.user);
    } catch (err) {
      setErrorMsg(err.message || 'Đăng ký tài khoản thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍄</span>
            <div>
              <h1 className="text-lg font-bold tracking-wide">
                MUSHROOM IOT SMART FARM
              </h1>
              <p className="text-xs text-slate-300">
                Hệ thống quản lý trồng nấm thông minh (Spring Boot + PostgreSQL)
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký Khách hàng
            </button>
          </div>

          {infoMsg && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-800">
              {infoMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email tài khoản
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mushroom.local"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800 px-1.5 py-1 rounded cursor-pointer"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition cursor-pointer"
              >
                {loading && !quickLoadingRole ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Đăng nhập nhanh (1-click)
                </p>
                <div className="space-y-1.5">
                  {QUICK_LOGIN_ACCOUNTS.map((acc) => {
                    const isBusy = quickLoadingRole === acc.role;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickLogin(acc)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-60 text-xs transition cursor-pointer flex flex-wrap items-center justify-between gap-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${acc.badgeClass}`}
                          >
                            {acc.role}
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {acc.email}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-600">
                          {isBusy ? 'Đang đăng nhập...' : acc.password}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="khachhang@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition cursor-pointer"
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản Khách hàng'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
