import React, { useEffect, useMemo, useState } from 'react';

const generateOtpCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export default function AuthPage({
  accounts = [],
  onLoginSuccess,
  onRegisterCustomer,
  onBackToWorkspace,
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [registerStep, setRegisterStep] = useState('form'); // 'form' | 'otp'

  // State đăng nhập
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // State đăng ký khách hàng + OTP
  const [fullName, setFullName] = useState('');
  const [contactChannel, setContactChannel] = useState('email'); // 'email' | 'phone'
  const [contactValue, setContactValue] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [registerError, setRegisterError] = useState('');
  const [registerInfo, setRegisterInfo] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const quickFillAccounts = useMemo(() => {
    const activeAdmin = accounts.find(
      (acc) => acc.role === 'Admin' && acc.status === 'Hoạt động'
    );
    const activeOperator = accounts.find(
      (acc) => acc.role === 'Operator' && acc.status === 'Hoạt động'
    );
    const inactiveAccount = accounts.find(
      (acc) => acc.status !== 'Hoạt động'
    );
    const customerAccount = accounts.find((acc) => acc.role === 'Customer');

    return [
      activeAdmin && {
        ...activeAdmin,
        quickLabel: `Admin: ${activeAdmin.fullName}`,
      },
      activeOperator && {
        ...activeOperator,
        quickLabel: `Operator: ${activeOperator.fullName}`,
      },
      inactiveAccount && {
        ...inactiveAccount,
        quickLabel: `Khóa: ${inactiveAccount.fullName}`,
      },
      customerAccount && {
        ...customerAccount,
        quickLabel: `Customer: ${customerAccount.fullName}`,
      },
    ].filter(Boolean);
  }, [accounts]);

  const handleQuickFill = (account) => {
    setIdentifier(account.email || account.phone || '');
    setPassword(account.password || '123456');
    setLoginError('');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setLoginError('Vui lòng nhập email/số điện thoại và mật khẩu.');
      return;
    }

    const matched = accounts.find((acc) => {
      const matchEmail =
        acc.email && acc.email.trim().toLowerCase() === cleanId;
      const matchPhone =
        acc.phone && acc.phone.trim().toLowerCase() === cleanId;
      const matchName =
        acc.fullName && acc.fullName.trim().toLowerCase() === cleanId;
      return matchEmail || matchPhone || matchName;
    });

    if (!matched) {
      setLoginError(
        'Không tìm thấy tài khoản phù hợp. Kiểm tra lại thông tin hoặc chọn tài khoản mẫu bên dưới.'
      );
      return;
    }

    if (matched.status !== 'Hoạt động') {
      setLoginError(
        `Tài khoản "${matched.fullName}" đang ở trạng thái "${matched.status}" nên không thể đăng nhập.`
      );
      return;
    }

    const expectedPass = matched.password || '123456';
    if (cleanPass !== expectedPass) {
      setLoginError('Mật khẩu chưa chính xác (mật khẩu mẫu mặc định: 123456).');
      return;
    }

    setLoginError('');
    onLoginSuccess(matched);
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanContact = contactValue.trim();
    const cleanPass = regPassword.trim();

    if (!cleanName || !cleanContact || !cleanPass) {
      setRegisterError(
        'Vui lòng nhập đầy đủ họ tên, email/số điện thoại và mật khẩu.'
      );
      return;
    }

    if (contactChannel === 'email' && !cleanContact.includes('@')) {
      setRegisterError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (contactChannel === 'phone') {
      const digitsOnly = cleanContact.replace(/\D/g, '');
      if (digitsOnly.length < 9) {
        setRegisterError('Vui lòng nhập số điện thoại hợp lệ (ít nhất 9 số).');
        return;
      }
    }

    if (cleanPass.length < 6) {
      setRegisterError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    const duplicated = accounts.some((acc) => {
      const target = cleanContact.toLowerCase();
      return (
        (acc.email && acc.email.trim().toLowerCase() === target) ||
        (acc.phone && acc.phone.trim().toLowerCase() === target)
      );
    });

    if (duplicated) {
      setRegisterError(
        'Email hoặc số điện thoại này đã được đăng ký trong hệ thống.'
      );
      return;
    }

    const code = generateOtpCode();
    setExpectedOtp(code);
    setOtpCode(code);
    setOtpInput('');
    setRegisterStep('otp');
    setRegisterError('');
    setResendCooldown(30);
    setRegisterInfo(
      `Đã gửi mã OTP xác thực tới ${
        contactChannel === 'email' ? 'email' : 'số điện thoại'
      } "${cleanContact}".`
    );
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const code = generateOtpCode();
    setExpectedOtp(code);
    setOtpCode(code);
    setOtpInput('');
    setResendCooldown(30);
    setRegisterError('');
    setRegisterInfo(`Đã gửi lại mã OTP mới tới "${contactValue.trim()}".`);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpInput.trim() !== expectedOtp) {
      setRegisterError('Mã OTP không đúng. Vui lòng kiểm tra lại mã xác thực.');
      return;
    }

    const cleanContact = contactValue.trim();
    const newCustomer = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      fullName: fullName.trim(),
      email: contactChannel === 'email' ? cleanContact : '',
      phone: contactChannel === 'phone' ? cleanContact : '',
      password: regPassword.trim(),
      role: 'Customer',
      accountType: 'Khách hàng',
      status: 'Hoạt động',
      verifiedOtp: true,
    };

    setRegisterError('');
    onRegisterCustomer(newCustomer);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* CỘT TRÁI: GIỚI THIỆU KIẾN TRÚC PHÂN LUỒNG */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍄</span>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  MUSHROOM IOT
                </h1>
                <p className="text-xs text-slate-400">
                  Hệ thống quản lý nuôi trồng nấm thông minh
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2.5 text-xs text-slate-300">
              <p className="font-semibold text-emerald-400">
                Phân luồng tài khoản rõ ràng
              </p>
              <p>
                • <strong>Nhân viên (Admin / Operator):</strong> Do Admin cấp
                quyền trong mục Quản lý tài khoản, không tự đăng ký công khai.
              </p>
              <p>
                • <strong>Khách hàng (Customer):</strong> Tự đăng ký bằng Email
                hoặc SĐT, kích hoạt tài khoản qua mã OTP và thao tác trong cổng
                thuê khay riêng.
              </p>
            </div>
          </div>

          {onBackToWorkspace && (
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              ← Quay lại khu vực vận hành demo
            </button>
          )}
        </div>

        {/* CỘT PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ + OTP */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-5">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập hệ thống
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegisterError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký Khách hàng (OTP)
            </button>
          </div>

          {mode === 'login' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Đăng nhập tài khoản
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hỗ trợ đăng nhập cho Admin, Operator và Khách hàng (mật khẩu
                  mẫu: <code className="font-semibold">123456</code>)
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Email hoặc Số điện thoại *
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="VD: admin@mushroom.vn hoặc 0901234567"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Nhập mật khẩu (mặc định: 123456)"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    <p className="text-xs text-red-700 font-medium">
                      {loginError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition cursor-pointer"
                >
                  Đăng nhập
                </button>
              </form>

              {/* TÀI KHOẢN MẪU ĐỂ TEST NHANH */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500">
                  Điền nhanh tài khoản mẫu để test:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickFillAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickFill(acc)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      {acc.quickLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : registerStep === 'form' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Đăng ký tài khoản Khách thuê
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nhập thông tin cơ bản và chọn nhận mã OTP qua Email hoặc Số
                  điện thoại
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (registerError) setRegisterError('');
                    }}
                    placeholder="VD: Trần Minh Khoa"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Kênh nhận mã OTP *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setContactChannel('email');
                        setContactValue('');
                        setRegisterError('');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        contactChannel === 'email'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Đăng ký qua Email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setContactChannel('phone');
                        setContactValue('');
                        setRegisterError('');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        contactChannel === 'phone'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Đăng ký qua Số điện thoại
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    {contactChannel === 'email'
                      ? 'Địa chỉ Email *'
                      : 'Số điện thoại *'}
                  </label>
                  <input
                    type={contactChannel === 'email' ? 'email' : 'tel'}
                    value={contactValue}
                    onChange={(e) => {
                      setContactValue(e.target.value);
                      if (registerError) setRegisterError('');
                    }}
                    placeholder={
                      contactChannel === 'email'
                        ? 'VD: minh.khoa@gmail.com'
                        : 'VD: 0912345678'
                    }
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Mật khẩu (ít nhất 6 ký tự) *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (registerError) setRegisterError('');
                    }}
                    placeholder="Nhập mật khẩu tài khoản"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {registerError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    <p className="text-xs text-red-700 font-medium">
                      {registerError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition cursor-pointer"
                >
                  Gửi mã OTP xác thực
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Xác thực mã OTP
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {registerInfo}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-900">
                  <p className="font-semibold">Mã OTP mô phỏng (chế độ test):</p>
                  <p className="text-amber-700 mt-0.5">
                    Khi nối Backend thật, mã sẽ được gửi qua Email/SMS service.
                  </p>
                </div>
                <span className="text-base font-bold tracking-widest bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg">
                  {otpCode}
                </span>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Nhập mã OTP 6 chữ số *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      if (registerError) setRegisterError('');
                    }}
                    placeholder="Nhập mã 6 số"
                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm tracking-widest font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {registerError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                    <p className="text-xs text-red-700 font-medium">
                      {registerError}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('form');
                      setRegisterError('');
                    }}
                    className="text-xs px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    ← Đổi thông tin
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={handleResendOtp}
                    className={`text-xs px-3 py-2 rounded-lg font-medium ${
                      resendCooldown > 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer'
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Gửi lại OTP (${resendCooldown}s)`
                      : 'Gửi lại mã OTP'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition cursor-pointer"
                >
                  Xác nhận OTP & Kích hoạt tài khoản
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}