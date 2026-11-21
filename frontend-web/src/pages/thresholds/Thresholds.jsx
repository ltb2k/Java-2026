import React, { useEffect, useState } from "react";

const DEFAULT_ROOM_THRESHOLD = {
  tempMin: 22,
  tempMax: 28,
  humidityMin: 80,
  humidityMax: 90,
  co2Min: 600,
  co2Max: 1200,
  substrateMin: 55,
  substrateMax: 70,
};

const THRESHOLD_FIELDS = [
  {
    key: "temperature",
    label: "Nhiệt độ",
    unit: "°C",
    minKey: "tempMin",
    maxKey: "tempMax",
    minBound: 0,
    maxBound: 80,
    step: "0.5",
  },
  {
    key: "humidity",
    label: "Độ ẩm không khí",
    unit: "%",
    minKey: "humidityMin",
    maxKey: "humidityMax",
    minBound: 0,
    maxBound: 100,
    step: "1",
  },
  {
    key: "co2",
    label: "CO₂",
    unit: "ppm",
    minKey: "co2Min",
    maxKey: "co2Max",
    minBound: 0,
    maxBound: 10000,
    step: "50",
  },
  {
    key: "substrateMoisture",
    label: "Độ ẩm giá thể",
    unit: "%",
    minKey: "substrateMin",
    maxKey: "substrateMax",
    minBound: 0,
    maxBound: 100,
    step: "1",
  },
];

function getRoomThresholdConfig(thresholds, roomId) {
  return {
    ...DEFAULT_ROOM_THRESHOLD,
    ...(thresholds?.[roomId] || {}),
  };
}

export default function Thresholds({
  rooms = [],
  devices = [],
  thresholds = {},
  setThresholds,
}) {
  const [selectedRoomId, setSelectedRoomId] = useState(() =>
    rooms.length > 0 ? Number(rooms[0].id) : null
  );

  useEffect(() => {
    if (!rooms || rooms.length === 0) {
      setSelectedRoomId(null);
      return;
    }

    const exists = rooms.some((r) => Number(r.id) === Number(selectedRoomId));
    if (!exists) {
      setSelectedRoomId(Number(rooms[0].id));
    }
  }, [rooms, selectedRoomId]);

  const [formValues, setFormValues] = useState(() =>
    getRoomThresholdConfig(thresholds, rooms[0]?.id ?? 1)
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    if (selectedRoomId == null) return;
    setFormValues(getRoomThresholdConfig(thresholds, selectedRoomId));
    setErrorMsg("");
    setSavedNotice("");
  }, [selectedRoomId]);

  if (!rooms || rooms.length === 0 || selectedRoomId == null) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          Chưa có phòng nuôi nào
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Vui lòng thêm phòng nuôi trước khi thiết lập ngưỡng môi trường.
        </p>
      </div>
    );
  }

  const currentRoom = rooms.find((r) => Number(r.id) === Number(selectedRoomId));
  const roomDevices = devices.filter(
    (d) => Number(d.roomId) === Number(selectedRoomId)
  );

  // Dữ liệu cảm biến mô phỏng (chưa phải dữ liệu IoT/ESP32 thật)
  const simulatedMetrics = {
    temperature: 26.5,
    humidity: 84,
    co2: 1350,
    substrateMoisture: 62,
  };

  const activeConfig = getRoomThresholdConfig(thresholds, selectedRoomId);
  const warnings = [];

  if (simulatedMetrics.temperature < activeConfig.tempMin) {
    warnings.push(
      `Nhiệt độ (${simulatedMetrics.temperature}°C) thấp hơn ngưỡng tối thiểu (${activeConfig.tempMin}°C)`
    );
  } else if (simulatedMetrics.temperature > activeConfig.tempMax) {
    warnings.push(
      `Nhiệt độ (${simulatedMetrics.temperature}°C) vượt ngưỡng tối đa (${activeConfig.tempMax}°C)`
    );
  }

  if (simulatedMetrics.humidity < activeConfig.humidityMin) {
    warnings.push(
      `Độ ẩm không khí (${simulatedMetrics.humidity}%) thấp hơn ngưỡng tối thiểu (${activeConfig.humidityMin}%)`
    );
  } else if (simulatedMetrics.humidity > activeConfig.humidityMax) {
    warnings.push(
      `Độ ẩm không khí (${simulatedMetrics.humidity}%) vượt ngưỡng tối đa (${activeConfig.humidityMax}%)`
    );
  }

  if (simulatedMetrics.co2 < activeConfig.co2Min) {
    warnings.push(
      `CO₂ (${simulatedMetrics.co2} ppm) thấp hơn ngưỡng tối thiểu (${activeConfig.co2Min} ppm)`
    );
  } else if (simulatedMetrics.co2 > activeConfig.co2Max) {
    warnings.push(
      `CO₂ (${simulatedMetrics.co2} ppm) vượt ngưỡng tối đa (${activeConfig.co2Max} ppm)`
    );
  }

  if (simulatedMetrics.substrateMoisture < activeConfig.substrateMin) {
    warnings.push(
      `Độ ẩm giá thể (${simulatedMetrics.substrateMoisture}%) thấp hơn ngưỡng tối thiểu (${activeConfig.substrateMin}%)`
    );
  } else if (simulatedMetrics.substrateMoisture > activeConfig.substrateMax) {
    warnings.push(
      `Độ ẩm giá thể (${simulatedMetrics.substrateMoisture}%) vượt ngưỡng tối đa (${activeConfig.substrateMax}%)`
    );
  }

  const handleRoomSelect = (e) => {
    const nextRoomId = Number(e.target.value);
    setSelectedRoomId(nextRoomId);
  };

  const handleFieldChange = (fieldKey, rawValue) => {
    setErrorMsg("");
    setSavedNotice("");
    setFormValues((prev) => ({
      ...prev,
      [fieldKey]: rawValue === "" ? "" : Number(rawValue),
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSavedNotice("");

    for (const field of THRESHOLD_FIELDS) {
      const minVal = formValues[field.minKey];
      const maxVal = formValues[field.maxKey];

      if (
        minVal === "" ||
        maxVal === "" ||
        Number.isNaN(Number(minVal)) ||
        Number.isNaN(Number(maxVal))
      ) {
        setErrorMsg(
          `Vui lòng nhập đầy đủ ngưỡng tối thiểu và tối đa cho ${field.label}.`
        );
        return;
      }

      const numMin = Number(minVal);
      const numMax = Number(maxVal);

      if (
        numMin < field.minBound ||
        numMin > field.maxBound ||
        numMax < field.minBound ||
        numMax > field.maxBound
      ) {
        setErrorMsg(
          `${field.label} phải nằm trong khoảng ${field.minBound} – ${field.maxBound} ${field.unit}.`
        );
        return;
      }

      if (numMin > numMax) {
        setErrorMsg(
          `Ngưỡng tối thiểu không được lớn hơn ngưỡng tối đa ở mục ${field.label}.`
        );
        return;
      }
    }

    const normalizedConfig = {
      tempMin: Number(formValues.tempMin),
      tempMax: Number(formValues.tempMax),
      humidityMin: Number(formValues.humidityMin),
      humidityMax: Number(formValues.humidityMax),
      co2Min: Number(formValues.co2Min),
      co2Max: Number(formValues.co2Max),
      substrateMin: Number(formValues.substrateMin),
      substrateMax: Number(formValues.substrateMax),
    };

    const numericRoomId = Number(selectedRoomId);

    setThresholds((prev) => ({
      ...prev,
      [numericRoomId]: normalizedConfig,
    }));
    setFormValues(normalizedConfig);
    setSavedNotice(
      `Đã lưu cấu hình ngưỡng cho ${currentRoom?.name || `Phòng #${numericRoomId}`}.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Chọn phòng nuôi */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Chọn phòng nuôi
            </h2>
            <p className="text-sm text-slate-500">
              Cấu hình ngưỡng riêng từng phòng ({roomDevices.length} thiết bị thuộc phòng)
            </p>
          </div>

          <select
            value={selectedRoomId}
            onChange={handleRoomSelect}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {rooms.map((room) => (
              <option key={room.id} value={Number(room.id)}>
                {room.name} (ID: {room.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cảnh báo vượt ngưỡng (từ dữ liệu mô phỏng) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-800">
            Cảnh báo vượt ngưỡng
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Dữ liệu cảm biến mô phỏng (chưa nối IoT thật)
          </span>
        </div>

        {warnings.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {warnings.map((item, idx) => (
              <li
                key={idx}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Các chỉ số mô phỏng hiện tại đang nằm trong ngưỡng đã lưu.
          </p>
        )}
      </div>

      {/* Form cấu hình 4 thông số Min / Max */}
      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {THRESHOLD_FIELDS.map((field) => (
            <div
              key={field.key}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {field.label}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {field.unit} ({field.minBound}–{field.maxBound})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Ngưỡng tối thiểu (Min)
                  </label>
                  <input
                    type="number"
                    min={field.minBound}
                    max={field.maxBound}
                    step={field.step}
                    value={formValues[field.minKey]}
                    onChange={(e) =>
                      handleFieldChange(field.minKey, e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Ngưỡng tối đa (Max)
                  </label>
                  <input
                    type="number"
                    min={field.minBound}
                    max={field.maxBound}
                    step={field.step}
                    value={formValues[field.maxKey]}
                    onChange={(e) =>
                      handleFieldChange(field.maxKey, e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {errorMsg && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        {savedNotice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {savedNotice}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Lưu cấu hình
          </button>
        </div>
      </form>
    </div>
  );
}