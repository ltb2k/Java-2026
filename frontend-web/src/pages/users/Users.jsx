import React, { useMemo, useState } from 'react';

const INITIAL_USERS_DATA = [
  {
    id: 'USR-01',
    fullName: 'Nguyễn Minh Khoa',
    email: 'khoa.nguyen@mushroomiot.vn',
    phone: '0901 234 567',
    role: 'Admin',
    status: 'Hoạt động',
  },
  {
    id: 'USR-02',
    fullName: 'Trần Thu Hà',
    email: 'ha.tran@mushroomiot.vn',
    phone: '0912 345 678',
    role: 'Operator',
    status: 'Hoạt động',
  },
  {
    id: 'USR-03',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@mushroomiot.vn',
    phone: '0987 654 321',
    role: 'Operator',
    status: 'Hoạt động',
  },
  {
    id: 'USR-04',
    fullName: 'Phạm Ngọc Mai',
    email: 'mai.pham@mushroomiot.vn',
    phone: '0933 111 222',
    role: 'Operator',
    status: 'Không hoạt động',
  },
];

const ROLE_BADGE = {
  Admin: 'bg-purple-100 text-purple-700',
  Operator: 'bg-blue-100 text-blue-700',
};

const STATUS_BADGE = {
  'Hoạt động': 'bg-emerald-100 text-emerald-700',
  'Không hoạt động': 'bg-slate-200 text-slate-600',
};

export default function Users({ currentRole = 'Operator' }) {
  const [users, setUsers] = useState(INITIAL_USERS_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form thêm / chỉnh sửa tài khoản
  const [editingId, setEditingId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Operator');
  const [status, setStatus] = useState('Hoạt động');
  const [formError, setFormError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Modal chi tiết & hộp thoại xác nhận khóa/mở khóa
  const [detailUser, setDetailUser] = useState(null);
  const [pendingStatusUser, setPendingStatusUser] = useState(null);

  const isAdmin = currentRole === 'Admin';

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        item.fullName.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.phone.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword);

      const matchRole = roleFilter === 'ALL' || item.role === roleFilter;
      const matchStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeCount = users.filter((u) => u.status === 'Hoạt động').length;
    const adminCount = users.filter((u) => u.role === 'Admin').length;
    const operatorCount = users.filter((u) => u.role === 'Operator').length;

    return {
      total: users.length,
      activeCount,
      adminCount,
      operatorCount,
    };
  }, [users]);

  const resetForm = () => {
    setEditingId(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('Operator');
    setStatus('Hoạt động');
    setFormError('');
  };

  const notifyAdminRequired = () => {
    setFormError(
      'Chức năng quản lý tài khoản yêu cầu vai trò Admin. Vui lòng chuyển vai trò ở góc trên sang Admin để thao tác.'
    );
  };

  const handleStartEdit = (userItem) => {
    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    setDetailUser(null);
    setEditingId(userItem.id);
    setFullName(userItem.fullName);
    setEmail(userItem.email);
    setPhone(userItem.phone);
    setRole(userItem.role);
    setStatus(userItem.status);
    setFormError('');
    setFeedbackMsg('');
  };

  const handleRequestToggleStatus = (userItem) => {
    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    setPendingStatusUser(userItem);
  };

  const handleConfirmToggleStatus = () => {
    if (!pendingStatusUser) return;

    const target = pendingStatusUser;
    const nextStatus =
      target.status === 'Hoạt động' ? 'Không hoạt động' : 'Hoạt động';

    setUsers((prev) =>
      prev.map((item) =>
        item.id === target.id ? { ...item, status: nextStatus } : item
      )
    );

    if (detailUser?.id === target.id) {
      setDetailUser({ ...target, status: nextStatus });
    }

    setFeedbackMsg(
      `Đã cập nhật trạng thái tài khoản ${target.fullName} thành "${nextStatus}".`
    );
    setFormError('');
    setPendingStatusUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setFormError('Vui lòng nhập đầy đủ họ tên, email và số điện thoại.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Địa chỉ email chưa đúng định dạng (VD: ten@domain.com).');
      return;
    }

    const normalizedEmail = trimmedEmail.toLowerCase();
    const isDuplicateEmail = users.some(
      (item) =>
        item.email.trim().toLowerCase() === normalizedEmail &&
        item.id !== editingId
    );

    if (isDuplicateEmail) {
      setFormError(
        `Email "${trimmedEmail}" đã được sử dụng bởi một tài khoản khác.`
      );
      return;
    }

    const digitsOnly = trimmedPhone.replace(/\D/g, '');
    if (digitsOnly.length < 9 || digitsOnly.length > 12) {
      setFormError('Số điện thoại không hợp lệ (cần từ 9 đến 12 chữ số).');
      return;
    }

    if (editingId) {
      setUsers((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                fullName: trimmedName,
                email: trimmedEmail,
                phone: trimmedPhone,
                role,
                status,
              }
            : item
        )
      );
      setFeedbackMsg(`Đã cập nhật thông tin tài khoản ${trimmedName}.`);
      resetForm();
      return;
    }

    const maxNum = users.reduce((max, u) => {
      const parsed = Number(String(u.id).replace('USR-', ''));
      return Number.isNaN(parsed) ? max : Math.max(max, parsed);
    }, 0);

    const newId = `USR-${String(maxNum + 1).padStart(2, '0')}`;
    const newUser = {
      id: newId,
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      role,
      status,
    };

    setUsers((prev) => [newUser, ...prev]);
    setFeedbackMsg(`Đã thêm tài khoản mới ${newUser.fullName} (${newId}).`);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div
        className={`border rounded-xl px-4 py-3 flex flex-wrap justify-between items-center gap-2 ${
          isAdmin
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}
      >
        <p className="text-sm">
          <strong>Vai trò hiện tại: {currentRole}.</strong>{' '}
          {isAdmin
            ? 'Bạn có đầy đủ quyền thêm mới, chỉnh sửa và khóa/mở khóa tài khoản.'
            : 'Chế độ Operator hiện chỉ hỗ trợ xem và lọc danh sách. Chuyển sang vai trò Admin để thêm, sửa hoặc khóa/mở khóa tài khoản.'}
        </p>
      </div>

      {/* THỐNG KÊ TÀI KHOẢN */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tổng quan tài khoản
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Thống kê số lượng người dùng theo trạng thái và vai trò hệ thống
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Tổng tài khoản"
            value={stats.total}
            description="Tất cả tài khoản trên hệ thống"
            color="text-gray-800"
          />
          <StatCard
            title="Đang hoạt động"
            value={stats.activeCount}
            description="Có thể đăng nhập sử dụng"
            color="text-emerald-600"
          />
          <StatCard
            title="Quản trị viên (Admin)"
            value={stats.adminCount}
            description="Quyền quản lý cấu hình & người dùng"
            color="text-purple-600"
          />
          <StatCard
            title="Vận hành (Operator)"
            value={stats.operatorCount}
            description="Theo dõi khay, sinh trưởng & thu hoạch"
            color="text-blue-600"
          />
        </div>
      </section>

      {/* DANH SÁCH & BỘ LỌC TÀI KHOẢN */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Danh sách tài khoản
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Xem chi tiết, tìm kiếm, lọc vai trò, chỉnh sửa hoặc khóa/mở
                khóa tài khoản
              </p>
            </div>

            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              Hiển thị {filteredUsers.length}/{users.length} tài khoản
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT hoặc mã..."
              className="md:col-span-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Operator">Operator</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Không hoạt động">Không hoạt động</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Mã</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email / SĐT</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((item) => (
                <tr
                  key={item.id}
                  className={`transition ${
                    editingId === item.id
                      ? 'bg-emerald-50/50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    {item.id}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {item.fullName}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-700">{item.email}</div>
                    <div className="text-xs text-gray-500">{item.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        ROLE_BADGE[item.role] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STATUS_BADGE[item.status] ||
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDetailUser(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer"
                    >
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        isAdmin
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestToggleStatus(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : item.status === 'Hoạt động'
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {item.status === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-500">
                    Không tìm thấy tài khoản nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORM THÊM / CẬP NHẬT TÀI KHOẢN */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingId
                ? `Chỉnh sửa tài khoản (${editingId})`
                : 'Thêm tài khoản mới'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingId
                ? 'Cập nhật thông tin, vai trò hoặc trạng thái hoạt động'
                : 'Tạo tài khoản nhân viên vận hành hoặc quản trị viên'}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        {feedbackMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <p className="text-sm text-emerald-800 font-medium">{feedbackMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="VD: Nguyễn Văn An"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="VD: an.nguyen@mushroomiot.vn"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Số điện thoại *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="VD: 0909 888 777"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Operator">Operator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Không hoạt động">Không hoạt động</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600 font-medium">{formError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-400 hover:bg-slate-500'
              }`}
            >
              {editingId ? 'Lưu cập nhật' : 'Thêm tài khoản'}
            </button>
          </div>
        </form>
      </section>

      {/* MODAL XEM CHI TIẾT TÀI KHOẢN */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Chi tiết tài khoản — {detailUser.id}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thông tin đầy đủ của người dùng trong hệ thống
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Họ và tên:</span>
                <span className="font-medium text-gray-800">
                  {detailUser.fullName}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-800">{detailUser.email}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="text-gray-800">{detailUser.phone}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-500">Vai trò:</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    ROLE_BADGE[detailUser.role] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {detailUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-500">Trạng thái:</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_BADGE[detailUser.status] ||
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  {detailUser.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(detailUser)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HỘP THOẠI XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN */}
      {pendingStatusUser && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setPendingStatusUser(null)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-sm w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {pendingStatusUser.status === 'Hoạt động'
                  ? 'Xác nhận khóa tài khoản'
                  : 'Xác nhận mở khóa tài khoản'}
              </h3>
              <p className="text-sm text-gray-600 mt-1.5">
                Bạn có chắc muốn{' '}
                <strong>
                  {pendingStatusUser.status === 'Hoạt động'
                    ? 'khóa'
                    : 'mở khóa'}
                </strong>{' '}
                tài khoản <strong>{pendingStatusUser.fullName}</strong> (
                {pendingStatusUser.email}) không?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingStatusUser(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium text-white cursor-pointer ${
                  pendingStatusUser.status === 'Hoạt động'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {pendingStatusUser.status === 'Hoạt động'
                  ? 'Xác nhận khóa'
                  : 'Xác nhận mở khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
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