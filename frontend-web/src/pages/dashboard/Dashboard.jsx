
import React, { useState } from 'react';

const INITIAL_ROOMS = [
  {
    id: 1,
    name: 'Phòng Nấm Linh Chi - Khu A',
    mushroom: 'Nấm Linh Chi',
    temp: 28.5,
    humidity: 85,
    co2: 600,
    status: 'NORMAL',
    fan: false,
    alert: '',
  },
  {
    id: 2,
    name: 'Phòng Nấm Bào Ngư - Khu B',
    mushroom: 'Nấm Bào Ngư',
    temp: 31.2,
    humidity: 72,
    co2: 950,
    status: 'WARNING',
    fan: true,
    alert: 'Thông số môi trường cần được kiểm tra.',
  },
];

function StatCard({ title, value, description, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <p className={`text-2xl font-bold mt-2 ${color}`}>
        {value}
      </p>

      <p className="text-xs text-gray-400 mt-1">
        {description}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);

  const totalRooms = rooms.length;

  const normalRooms = rooms.filter(
    (room) => room.status === 'NORMAL'
  ).length;

  const warningRooms = rooms.filter(
    (room) => room.status === 'WARNING'
  ).length;

  const runningFans = rooms.filter(
    (room) => room.fan
  ).length;

  const toggleDevice = (id) => {
    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === id
          ? { ...room, fan: !room.fan }
          : room
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Thông báo dữ liệu mẫu */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-700">
          <strong>Lưu ý:</strong> Dashboard đang sử dụng dữ liệu mẫu.
          Các thông số và thao tác thiết bị chưa kết nối với hệ thống IoT thực tế.
        </p>
      </div>

      {/* Thống kê tổng quan */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Tổng quan hệ thống
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Tổng số phòng"
            value={totalRooms}
            description="Phòng nuôi nấm trong hệ thống"
            color="text-gray-800"
          />

          <StatCard
            title="Phòng ổn định"
            value={normalRooms}
            description="Đang có trạng thái bình thường"
            color="text-emerald-600"
          />

          <StatCard
            title="Phòng cảnh báo"
            value={warningRooms}
            description="Cần kiểm tra môi trường"
            color="text-red-600"
          />

          <StatCard
            title="Quạt đang chạy"
            value={runningFans}
            description="Thiết bị đang bật theo dữ liệu mẫu"
            color="text-blue-600"
          />
        </div>
      </section>

      {/* Danh sách phòng */}
      <section>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Giám sát môi trường phòng nuôi
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Theo dõi nhiệt độ, độ ẩm và nồng độ CO₂
            </p>
          </div>

          <span className="text-xs text-gray-500">
            {totalRooms} phòng
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {rooms.map((room) => {
            const isWarning = room.status === 'WARNING';

            return (
              <div
                key={room.id}
                className="bg-white rounded-xl shadow-sm p-5 border border-gray-200"
              >
                {/* Tên phòng và trạng thái */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      {room.name}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Loại nấm: {room.mushroom}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      isWarning
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {isWarning ? '⚠ Cảnh báo' : '● Ổn định'}
                  </span>
                </div>

                {/* Thông số môi trường */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">
                      Nhiệt độ
                    </p>

                    <p className="text-xl font-bold text-orange-500 mt-1">
                      {room.temp}°C
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">
                      Độ ẩm
                    </p>

                    <p className="text-xl font-bold text-blue-500 mt-1">
                      {room.humidity}%
                    </p>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">
                      Khí CO₂
                    </p>

                    <p className="text-xl font-bold text-purple-500 mt-1">
                      {room.co2}
                    </p>

                    <p className="text-[10px] text-gray-400">
                      ppm
                    </p>
                  </div>
                </div>

                {/* Điều khiển quạt */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Quạt thông gió
                    </p>

                    <p
                      className={`text-sm font-semibold mt-1 ${
                        room.fan
                          ? 'text-emerald-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {room.fan ? 'Đang chạy' : 'Đang tắt'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleDevice(room.id)}
                    aria-pressed={room.fan}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
                      room.fan
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {room.fan ? 'Tắt quạt' : 'Bật quạt'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Danh sách cảnh báo */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex justify-between items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Cảnh báo môi trường
          </h2>

          <span className="text-xs font-semibold bg-red-100 text-red-600 px-3 py-1 rounded-full">
            {warningRooms} cảnh báo
          </span>
        </div>

        {warningRooms === 0 ? (
          <p className="text-sm text-gray-500">
            Hiện không có phòng nào cần cảnh báo.
          </p>
        ) : (
          <div className="space-y-3">
            {rooms
              .filter((room) => room.status === 'WARNING')
              .map((room) => (
                <div
                  key={room.id}
                  className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-lg p-3"
                >
                  <span className="text-red-500">⚠️</span>

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {room.name}
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      {room.alert}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
