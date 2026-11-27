const WEATHER_TTL_MS = 10 * 60 * 1000;
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
const weatherCache = new Map();
const historyCache = new Map();

const REFERENCE_MEDIA = [
  {
    id: "internet-video-icar-mushroom-cultivation",
    type: "INTERNET_VIDEO",
    title: "Mushroom Cultivation — Kỹ thuật nuôi trồng nấm",
    topic: "Quy trình trồng nấm",
    provider: "YouTube · ICAR-IIHR",
    sourceUrl: "https://www.youtube.com/watch?v=oormRweSf3E",
    embedUrl: "https://www.youtube-nocookie.com/embed/oormRweSf3E?rel=0",
    license: "YouTube embed; Giấy phép công khai của ICAR-IIHR",
    status: "REFERENCE",
    checkedAt: "2026-10-11",
    description: "Video tư liệu kỹ thuật nuôi trồng nấm từ Viện Nghiên cứu Làm vườn ICAR, phục vụ tham khảo quy trình vi khí hậu."
  },
  {
    id: "internet-video-grocycle-timelapse",
    type: "INTERNET_VIDEO",
    title: "Oyster Mushroom Growth Timelapse (Sinh trưởng nấm bào ngư)",
    topic: "Chu kỳ sinh trưởng",
    provider: "YouTube · GroCycle",
    sourceUrl: "https://www.youtube.com/watch?v=FqS3oU_ZkR0",
    embedUrl: "https://www.youtube-nocookie.com/embed/FqS3oU_ZkR0?rel=0",
    license: "YouTube embed; Giấy phép công khai",
    status: "REFERENCE",
    checkedAt: "2026-10-11",
    description: "Video tua nhanh thời gian (timelapse) ghi lại toàn bộ chu kỳ bung mũ của nấm bào ngư xám trong điều kiện kiểm soát ẩm."
  },
  {
    id: "reference-image-oyster-mushroom",
    type: "REFERENCE_IMAGE",
    title: "Nấm Bào Ngư Xám (Pleurotus ostreatus)",
    topic: "Nấm bào ngư",
    provider: "Unsplash · Alex Master",
    sourceUrl: "https://images.unsplash.com/photo-1544979590-37e9b47eb705",
    imageUrl: "https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=1200&q=80",
    license: "Unsplash License (Miễn phí sử dụng thương mại & giáo dục)",
    status: "REFERENCE",
    checkedAt: "2026-10-11",
    description: "Ảnh mẫu tai nấm bào ngư xám phát triển đồng đều, mũ nấm dày và tơ nấm khỏe mạnh."
  },
  {
    id: "reference-image-white-oyster",
    type: "REFERENCE_IMAGE",
    title: "Nấm Bào Ngư Trắng (Pleurotus florida)",
    topic: "Nấm bào ngư trắng",
    provider: "Unsplash · Thomas Park",
    sourceUrl: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f",
    imageUrl: "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=1200&q=80",
    license: "Unsplash License (Miễn phí sử dụng thương mại & giáo dục)",
    status: "REFERENCE",
    checkedAt: "2026-10-11",
    description: "Ảnh mẫu nấm bào ngư trắng chùm quả thể xòe đều trong điều kiện độ ẩm cao 90%."
  }
];

const CULTIVATION_GUIDES = [
  {
    id: "penn-state-production",
    title: "Mushrooms Production and Harvesting",
    source: "Penn State Extension",
    sourceUrl: "https://extension.psu.edu/forage-and-food-crops/mushrooms/production-and-harvesting",
    scope: "Tài liệu tham khảo về quy trình trồng, không phải dữ liệu cảm biến trực tiếp.",
    checkedAt: "2026-10-11"
  },
  {
    id: "penn-state-agaricus",
    title: "Basic Procedures for Agaricus Mushroom Growing",
    source: "Penn State Extension",
    sourceUrl: "https://extension.psu.edu/basic-procedures-for-agaricus-mushroom-growing",
    scope: "Điều kiện phụ thuộc giống, giai đoạn và quy trình farm; không dùng làm ngưỡng chung tự động.",
    checkedAt: "2026-10-11"
  }
];

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function location() {
  return {
    latitude: number(process.env.WEATHER_LATITUDE, 10.8231),
    longitude: number(process.env.WEATHER_LONGITUDE, 106.6297),
    timezone: process.env.WEATHER_TIMEZONE || "Asia/Ho_Chi_Minh"
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`UPSTREAM_${response.status}`);
  return response.json();
}

function fromCache(cache, key, ttl) {
  const item = cache.get(key);
  return item && Date.now() - item.fetchedAt < ttl ? item.data : null;
}

function stale(cache, key) {
  const item = cache.get(key);
  return item ? { ...item.data, stale: true, fetchedAt: new Date(item.fetchedAt).toISOString() } : null;
}

exports.currentWeather = async (req, res) => {
  const place = location();
  const key = `${place.latitude},${place.longitude},${place.timezone}`;
  const cached = fromCache(weatherCache, key, WEATHER_TTL_MS);
  if (cached) return res.json({ ...cached, cached: true });
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", place.latitude);
    url.searchParams.set("longitude", place.longitude);
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m");
    url.searchParams.set("timezone", place.timezone);
    const data = await fetchJson(url);
    const payload = {
      classification: "OUTDOOR_WEATHER",
      sourceName: "Open-Meteo",
      sourceUrl: "https://open-meteo.com/en/docs",
      license: "CC BY 4.0 attribution required",
      observedAt: data.current?.time || null,
      fetchedAt: new Date().toISOString(),
      timezone: data.timezone || place.timezone,
      location: { latitude: data.latitude, longitude: data.longitude },
      temperature: data.current?.temperature_2m ?? null,
      temperatureUnit: data.current_units?.temperature_2m || "°C",
      humidity: data.current?.relative_humidity_2m ?? null,
      humidityUnit: data.current_units?.relative_humidity_2m || "%",
      isOperationalSensor: false,
      stale: false
    };
    weatherCache.set(key, { data: payload, fetchedAt: Date.now() });
    return res.json(payload);
  } catch (error) {
    const fallback = stale(weatherCache, key);
    if (fallback) return res.status(200).json(fallback);
    console.error("External weather request failed", { code: error.name || "UPSTREAM_ERROR" });
    return res.status(503).json({ message: "Nguồn thời tiết ngoài trời hiện không khả dụng" });
  }
};

exports.weatherHistory = async (req, res) => {
  const start = typeof req.query.start === "string" ? req.query.start : "";
  const end = typeof req.query.end === "string" ? req.query.end : "";
  if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end) || start > end) {
    return res.status(400).json({ message: "Ngày phải có định dạng YYYYMMDD" });
  }
  const duration = (Date.parse(`${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6)}T00:00:00Z`) - Date.parse(`${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6)}T00:00:00Z`)) / 86400000;
  if (!Number.isFinite(duration) || duration > 31) return res.status(400).json({ message: "Khoảng lịch sử tối đa là 31 ngày" });
  const place = location();
  const key = `${place.latitude},${place.longitude},${start},${end}`;
  const cached = fromCache(historyCache, key, HISTORY_TTL_MS);
  if (cached) return res.json({ ...cached, cached: true });
  try {
    const url = new URL("https://power.larc.nasa.gov/api/temporal/hourly/point");
    url.search = new URLSearchParams({ parameters: "T2M,RH2M", community: "AG", longitude: place.longitude, latitude: place.latitude, start, end, format: "JSON", "time-standard": "UTC" }).toString();
    const data = await fetchJson(url);
    const temperatures = data.properties?.parameter?.T2M || {};
    const humidities = data.properties?.parameter?.RH2M || {};
    const points = Object.keys(temperatures).map((time) => ({ time, temperature: temperatures[time], humidity: humidities[time] ?? null })).filter((x) => x.temperature !== -999 && x.humidity !== -999);
    const payload = {
      classification: "OUTDOOR_CLIMATE_HISTORY",
      sourceName: "NASA POWER",
      sourceUrl: "https://power.larc.nasa.gov/docs/services/api/temporal/hourly/",
      license: "NASA open data; cite NASA POWER",
      fetchedAt: new Date().toISOString(),
      timezone: "UTC",
      unit: { temperature: "°C", humidity: "%" },
      isOperationalSensor: false,
      points,
      stale: false
    };
    historyCache.set(key, { data: payload, fetchedAt: Date.now() });
    return res.json(payload);
  } catch (error) {
    const fallback = stale(historyCache, key);
    if (fallback) return res.status(200).json(fallback);
    console.error("External climate request failed", { code: error.name || "UPSTREAM_ERROR" });
    return res.status(503).json({ message: "Nguồn lịch sử khí hậu hiện không khả dụng" });
  }
};

exports.referenceMedia = (req, res) => res.json(REFERENCE_MEDIA);
exports.cultivationGuides = (req, res) => res.json(CULTIVATION_GUIDES);
