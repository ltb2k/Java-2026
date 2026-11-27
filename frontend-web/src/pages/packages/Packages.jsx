import React, { useMemo, useState } from 'react';

const INITIAL_PACKAGES_DATA = [
  {
    id: 'PKG-01',
    name: 'Gói Trải Nghiệm Bào Ngư 30 Ngày',
    mushroomType: 'Nấm Bào Ngư',
    durationDays: 30,
    trayCount: 1,
    price: 350000,
    status: 'Đang áp dụng',
    description:
      'Phù hợp cho khách hàng trải nghiệm thuê 1 khay nấm bào ngư, theo dõi nhiệt độ/độ ẩm trực tuyến và nhận thành phẩm cuối kỳ.',
    benefits: [
      '01 khay phôi nấm Bào Ngư đạt chuẩn',
      'Giám sát cảm biến nhiệt độ, độ ẩm 24/7',
      'Hỗ trợ chăm sóc & thu hoạch bàn giao tận nơi',
    ],
  },
  {
    id: 'PKG-02',
    name: 'Gói Linh Chi Tiêu Chuẩn 45 Ngày',
    mushroomType: 'Nấm Linh Chi',
    durationDays: 45,
    trayCount: 1,
    price: 650000,
    status: 'Đang áp dụng',
    description:
      'Chu kỳ nuôi trồng 45 ngày dành cho nấm Linh Chi với chế độ kiểm soát môi trường tự động và cập nhật sinh trưởng định kỳ.',
    benefits: [
      '01 khay phôi nấm Linh Chi chọn lọc',
      'Tự động điều tiết phun sương & thông gió theo ngưỡng',
      'Cập nhật nhật ký sinh trưởng và ảnh theo tuần',
    ],
  },
  {
    id: 'PKG-03',
    name: 'Gói Gia Đình 3 Khay Linh Hoạt',
    mushroomType: 'Nấm Bào Ngư / Linh Chi',
    durationDays: 45,
    trayCount: 3,
    price: 1590000,
    status: 'Đang áp dụng',
    description:
      'Gói tiết kiệm cho hộ gia đình hoặc nhóm khách thuê đồng thời 3 khay, tùy chọn kết hợp loại nấm theo phòng nuôi.',
    benefits: [
      '03 khay phôi nấm tùy chọn loại nấm',
      'Ưu tiên xếp khay tại phòng đạt chuẩn IoT',
      'Miễn phí đóng gói & phân loại sau thu hoạch',
    ],
  },
  {
    id: 'PKG-04',
    name: 'Gói Mùa Vụ Ngắn Hạn 20 Ngày',
    mushroomType: 'Nấm Bào Ngư',
    durationDays: 20,
    trayCount: 1,
    price: 250000,
    status: 'Tạm ngưng',
    description:
      'Gói khuyến mãi ngắn hạn theo đợt khai trương phòng nuôi mới, tạm ngưng nhận đăng ký mới.',
    benefits: [
      '01 khay phôi nấm giai đoạn kích quả',
      'Theo dõi thông số môi trường trên ứng dụng',
    ],
  },
];

const STATUS_BADGE = {
  'Đang áp dụng': 'bg-emerald-100 text-emerald-700',
  'Tạm ngưng': 'bg-slate-200 text-slate-600',
};

const formatCurrency = (amount) =>
  `${Number(amount || 0).toLocaleString('vi-VN')} đ`;

export default function Packages({ currentRole = 'Operator' }) {
  const [packages, setPackages] = useState(INITIAL_PACKAGES_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mushroomFilter, setMushroomFilter] = useState('ALL');

  // Form thêm / chỉnh sửa gói thuê
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [mushroomType, setMushroomType] = useState('Nấm Bào Ngư');
  const [durationDays, setDurationDays] = useState('30');
  const [trayCount, setTrayCount] = useState('1');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Đang áp dụng');
  const [description, setDescription] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [formError, setFormError] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Modal chi tiết & hộp thoại xác nhận đổi trạng thái / xóa
  const [detailPackage, setDetailPackage] = useState(null);
  const [pendingStatusPackage, setPendingStatusPackage] = useState(null);
  const [pendingDeletePackage, setPendingDeletePackage] = useState(null);

  const isAdmin = currentRole === 'Admin';

  const filteredPackages = useMemo(() => {
    return packages.filter((item) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.mushroomType.toLowerCase().includes(keyword) ||
        item.id.toLowerCase().includes(keyword);

      const matchStatus =
        statusFilter === 'ALL' || item.status === statusFilter;
      const matchMushroom =
        mushroomFilter === 'ALL' ||
        item.mushroomType.toLowerCase().includes(mushroomFilter.toLowerCase());

      return matchSearch && matchStatus && matchMushroom;
    });
  }, [packages, searchTerm, statusFilter, mushroomFilter]);

  const stats = useMemo(() => {
    const activeCount = packages.filter(
      (p) => p.status === 'Đang áp dụng'
    ).length;
    const pausedCount = packages.filter((p) => p.status === 'Tạm ngưng').length;
    const avgPrice =
      packages.length > 0
        ? Math.round(
            packages.reduce((sum, p) => sum + Number(p.price || 0), 0) /
              packages.length
          )
        : 0;

    return {
      total: packages.length,
      activeCount,
      pausedCount,
      avgPrice,
    };
  }, [packages]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setMushroomType('Nấm Bào Ngư');
    setDurationDays('30');
    setTrayCount('1');
    setPrice('');
    setStatus('Đang áp dụng');
    setDescription('');
    setBenefitsText('');
    setFormError('');
  };

  const notifyAdminRequired = () => {
    setFormError(
      'Chức năng quản lý gói thuê yêu cầu vai trò Admin. Vui lòng chuyển vai trò ở góc trên sang Admin để thao tác.'
    );
  };

  const handleStartEdit = (pkg) => {
    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    setDetailPackage(null);
    setEditingId(pkg.id);
    setName(pkg.name);
    setMushroomType(pkg.mushroomType);
    setDurationDays(String(pkg.durationDays));
    setTrayCount(String(pkg.trayCount));
    setPrice(String(pkg.price));
    setStatus(pkg.status);
    setDescription(pkg.description || '');
    setBenefitsText((pkg.benefits || []).join('\n'));
    setFormError('');
    setFeedbackMsg('');
  };

  const handleRequestToggleStatus = (pkg) => {
    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    setPendingStatusPackage(pkg);
  };

  const handleConfirmToggleStatus = () => {
    if (!pendingStatusPackage) return;

    const target = pendingStatusPackage;
    const nextStatus =
      target.status === 'Đang áp dụng' ? 'Tạm ngưng' : 'Đang áp dụng';

    setPackages((prev) =>
      prev.map((item) =>
        item.id === target.id ? { ...item, status: nextStatus } : item
      )
    );

    if (detailPackage?.id === target.id) {
      setDetailPackage({ ...target, status: nextStatus });
    }

    setFeedbackMsg(
      `Đã cập nhật trạng thái gói "${target.name}" thành "${nextStatus}".`
    );
    setFormError('');
    setPendingStatusPackage(null);
  };

  const handleRequestDelete = (pkg) => {
    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    if (pkg.status === 'Đang áp dụng') {
      setFeedbackMsg('');
      setFormError(
        `Gói "${pkg.name}" (${pkg.id}) đang áp dụng. Vui lòng chuyển sang "Tạm ngưng" trước khi xóa để đảm bảo an toàn dữ liệu.`
      );
      return;
    }

    setFormError('');
    setPendingDeletePackage(pkg);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeletePackage) return;

    const target = pendingDeletePackage;
    setPackages((prev) => prev.filter((item) => item.id !== target.id));

    if (editingId === target.id) {
      resetForm();
    }
    if (detailPackage?.id === target.id) {
      setDetailPackage(null);
    }

    setFeedbackMsg(`Đã xóa gói thuê "${target.name}" (${target.id}) khỏi hệ thống.`);
    setFormError('');
    setPendingDeletePackage(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAdmin) {
      notifyAdminRequired();
      return;
    }

    const trimmedName = name.trim();
    const trimmedMushroom = mushroomType.trim();
    const parsedDays = Number(durationDays);
    const parsedTrays = Number(trayCount);
    const parsedPrice = Number(price);

    if (!trimmedName || !trimmedMushroom || !price) {
      setFormError('Vui lòng nhập đầy đủ tên gói, loại nấm và giá thuê.');
      return;
    }

    const normalizedName = trimmedName.toLowerCase();
    const isDuplicateName = packages.some(
      (item) =>
        item.name.trim().toLowerCase() === normalizedName &&
        item.id !== editingId
    );

    if (isDuplicateName) {
      setFormError(`Tên gói "${trimmedName}" đã tồn tại trong hệ thống.`);
      return;
    }

    if (Number.isNaN(parsedDays) || parsedDays <= 0) {
      setFormError('Thời hạn thuê phải lớn hơn 0 ngày.');
      return;
    }

    if (Number.isNaN(parsedTrays) || parsedTrays <= 0) {
      setFormError('Số lượng khay phải từ 1 khay trở lên.');
      return;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 10000) {
      setFormError('Giá gói thuê phải từ 10.000 đ trở lên.');
      return;
    }

    const parsedBenefits = benefitsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const finalBenefits =
      parsedBenefits.length > 0
        ? parsedBenefits
        : [
            `0${parsedTrays} khay ${trimmedMushroom} theo tiêu chuẩn phòng nuôi`,
            'Giám sát nhiệt độ, độ ẩm và thông số IoT trực tuyến',
          ];

    if (editingId) {
      setPackages((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: trimmedName,
                mushroomType: trimmedMushroom,
                durationDays: parsedDays,
                trayCount: parsedTrays,
                price: parsedPrice,
                status,
                description:
                  description.trim() ||
                  `Gói thuê ${parsedTrays} khay ${trimmedMushroom} trong ${parsedDays} ngày.`,
                benefits: finalBenefits,
              }
            : item
        )
      );
      setFeedbackMsg(`Đã cập nhật thông tin gói thuê "${trimmedName}".`);
      resetForm();
      return;
    }

    const maxNum = packages.reduce((max, p) => {
      const parsed = Number(String(p.id).replace('PKG-', ''));
      return Number.isNaN(parsed) ? max : Math.max(max, parsed);
    }, 0);

    const newId = `PKG-${String(maxNum + 1).padStart(2, '0')}`;
    const newPackage = {
      id: newId,
      name: trimmedName,
      mushroomType: trimmedMushroom,
      durationDays: parsedDays,
      trayCount: parsedTrays,
      price: parsedPrice,
      status,
      description:
        description.trim() ||
        `Gói thuê ${parsedTrays} khay ${trimmedMushroom} trong ${parsedDays} ngày.`,
      benefits: finalBenefits,
    };

    setPackages((prev) => [newPackage, ...prev]);
    setFeedbackMsg(`Đã thêm gói thuê mới "${newPackage.name}" (${newId}).`);
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
            ? 'Bạn có đầy đủ quyền tạo gói thuê mới, điều chỉnh giá, bật/tắt trạng thái và xóa gói đã tạm ngưng.'
            : 'Chế độ Operator hiện chỉ hỗ trợ tra cứu thông tin gói thuê. Chuyển sang vai trò Admin để thêm, sửa hoặc xóa gói dịch vụ.'}
        </p>
      </div>

      {/* THỐNG KÊ GÓI THUÊ */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Tổng quan gói thuê dịch vụ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh mục các gói thuê khay nấm đang cung cấp cho khách hàng
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Tổng gói thuê"
            value={stats.total}
            description="Tất cả gói dịch vụ đã cấu hình"
            color="text-gray-800"
          />
          <StatCard
            title="Đang áp dụng"
            value={stats.activeCount}
            description="Hiển thị cho khách hàng đăng ký"
            color="text-emerald-600"
          />
          <StatCard
            title="Tạm ngưng"
            value={stats.pausedCount}
            description="Ngừng nhận yêu cầu thuê mới"
            color="text-slate-600"
          />
          <StatCard
            title="Giá trung bình"
            value={formatCurrency(stats.avgPrice)}
            description="Mức giá bình quân trên mỗi gói"
            color="text-blue-600"
          />
        </div>
      </section>

      {/* DANH SÁCH GÓI THUÊ */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Danh sách gói thuê
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Xem chi tiết quyền lợi, lọc theo loại nấm, tạm ngưng hoặc xóa gói
                không còn sử dụng
              </p>
            </div>

            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
              Hiển thị {filteredPackages.length}/{packages.length} gói
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã gói, tên gói hoặc loại nấm..."
              className="md:col-span-2 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <select
              value={mushroomFilter}
              onChange={(e) => setMushroomFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả loại nấm</option>
              <option value="Bào Ngư">Nấm Bào Ngư</option>
              <option value="Linh Chi">Nấm Linh Chi</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang áp dụng">Đang áp dụng</option>
              <option value="Tạm ngưng">Tạm ngưng</option>
            </select>
          </div>

          {feedbackMsg && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <p className="text-sm text-emerald-800 font-medium">
                {feedbackMsg}
              </p>
            </div>
          )}

          {formError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-700 font-medium">{formError}</p>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-4">Mã gói</th>
                <th className="py-3 px-4">Tên gói thuê</th>
                <th className="py-3 px-4">Loại nấm</th>
                <th className="py-3 px-4">Thời hạn / Quy mô</th>
                <th className="py-3 px-4">Giá gói</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredPackages.map((item) => (
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
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                      {item.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {item.mushroomType}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    <div>{item.durationDays} ngày</div>
                    <div className="text-xs text-gray-500">
                      {item.trayCount} khay nuôi
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">
                    {formatCurrency(item.price)}
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
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDetailPackage(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer"
                    >
                      Chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
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
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : item.status === 'Đang áp dụng'
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {item.status === 'Đang áp dụng' ? 'Tạm ngưng' : 'Kích hoạt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(item)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        !isAdmin
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : item.status === 'Tạm ngưng'
                          ? 'bg-red-100 hover:bg-red-200 text-red-700'
                          : 'bg-red-50 hover:bg-red-100 text-red-500'
                      }`}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPackages.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-gray-500">
                    Không tìm thấy gói thuê nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORM THÊM / CẬP NHẬT GÓI THUÊ */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {editingId
                ? `Chỉnh sửa gói thuê (${editingId})`
                : 'Thêm gói thuê mới'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingId
                ? 'Cập nhật giá thuê, thời hạn chu kỳ hoặc quyền lợi đi kèm'
                : 'Cấu hình gói dịch vụ thuê khay mới cho khách hàng'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Tên gói thuê *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="VD: Gói Linh Chi Cao Cấp 45 Ngày"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Loại nấm áp dụng *
              </label>
              <select
                value={mushroomType}
                onChange={(e) => setMushroomType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Nấm Bào Ngư">Nấm Bào Ngư</option>
                <option value="Nấm Linh Chi">Nấm Linh Chi</option>
                <option value="Nấm Bào Ngư / Linh Chi">
                  Nấm Bào Ngư / Linh Chi
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Giá gói thuê (VNĐ) *
              </label>
              <input
                type="number"
                min="10000"
                step="10000"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="VD: 550000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Thời hạn thuê (ngày) *
              </label>
              <input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => {
                  setDurationDays(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Số lượng khay *
              </label>
              <input
                type="number"
                min="1"
                value={trayCount}
                onChange={(e) => {
                  setTrayCount(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
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
                <option value="Đang áp dụng">Đang áp dụng</option>
                <option value="Tạm ngưng">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Mô tả ngắn
              </label>
              <textarea
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả đối tượng phù hợp và đặc điểm chu kỳ nuôi..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Quyền lợi đi kèm (mỗi dòng 1 ý)
              </label>
              <textarea
                rows="3"
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder={
                  'VD:\n01 khay phôi nấm đạt chuẩn\nGiám sát IoT 24/7\nThu hoạch & bàn giao tận nơi'
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition cursor-pointer ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-400 hover:bg-slate-500'
              }`}
            >
              {editingId ? 'Lưu cập nhật' : 'Thêm gói thuê'}
            </button>
          </div>
        </form>
      </section>

      {/* MODAL XEM CHI TIẾT GÓI THUÊ */}
      {detailPackage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setDetailPackage(null)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-lg w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  {detailPackage.name} ({detailPackage.id})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Chi tiết thông tin gói thuê và quyền lợi dịch vụ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailPackage(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Loại nấm:</span>
                <span className="font-medium text-gray-800">
                  {detailPackage.mushroomType}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Thời hạn / Số khay:</span>
                <span className="text-gray-800">
                  {detailPackage.durationDays} ngày • {detailPackage.trayCount}{' '}
                  khay
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Giá thuê:</span>
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(detailPackage.price)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-500">Trạng thái:</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_BADGE[detailPackage.status] ||
                    'bg-slate-100 text-slate-700'
                  }`}
                >
                  {detailPackage.status}
                </span>
              </div>
              {detailPackage.description && (
                <div className="pt-1">
                  <p className="text-gray-500 mb-1">Mô tả gói:</p>
                  <p className="text-gray-700 bg-slate-50 rounded-lg p-3 text-xs leading-relaxed">
                    {detailPackage.description}
                  </p>
                </div>
              )}
              {detailPackage.benefits?.length > 0 && (
                <div className="pt-1">
                  <p className="text-gray-500 mb-1.5">Quyền lợi bao gồm:</p>
                  <ul className="space-y-1 text-xs text-gray-700 list-disc list-inside bg-emerald-50/60 rounded-lg p-3">
                    {detailPackage.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(detailPackage)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailPackage(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HỘP THOẠI XÁC NHẬN ĐỔI TRẠNG THÁI GÓI */}
      {pendingStatusPackage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setPendingStatusPackage(null)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-sm w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {pendingStatusPackage.status === 'Đang áp dụng'
                  ? 'Xác nhận tạm ngưng gói thuê'
                  : 'Xác nhận kích hoạt gói thuê'}
              </h3>
              <p className="text-sm text-gray-600 mt-1.5">
                Bạn có chắc muốn{' '}
                <strong>
                  {pendingStatusPackage.status === 'Đang áp dụng'
                    ? 'tạm ngưng'
                    : 'kích hoạt lại'}
                </strong>{' '}
                gói <strong>{pendingStatusPackage.name}</strong> không?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingStatusPackage(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium text-white cursor-pointer ${
                  pendingStatusPackage.status === 'Đang áp dụng'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HỘP THOẠI XÁC NHẬN XÓA GÓI THUÊ */}
      {pendingDeletePackage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setPendingDeletePackage(null)}
        >
          <div
            className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-sm w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold text-red-700">
                Xác nhận xóa gói thuê
              </h3>
              <p className="text-sm text-gray-600 mt-1.5">
                Bạn có chắc muốn xóa vĩnh viễn gói{' '}
                <strong>
                  {pendingDeletePackage.name} ({pendingDeletePackage.id})
                </strong>{' '}
                không? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeletePackage(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Xác nhận xóa
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