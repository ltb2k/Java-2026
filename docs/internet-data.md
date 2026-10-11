# Dữ liệu Internet và media tham khảo

## Phân loại bắt buộc

- `OUTDOOR_WEATHER`: thời tiết ngoài trời từ Open-Meteo. Không phải số đo trong phòng trồng.
- `OUTDOOR_CLIMATE_HISTORY`: dữ liệu khí hậu ngoài trời theo giờ từ NASA POWER. Không phải dữ liệu cảm biến farm.
- `INTERNET_VIDEO`: video được nhúng từ YouTube. Không phải camera trực tiếp.
- `REFERENCE_IMAGE`: ảnh minh họa có ghi nguồn và giấy phép.
- `THIẾT BỊ`: chỉ xuất hiện khi backend nhận dữ liệu từ thiết bị đã xác thực.

## Nguồn đang tích hợp

| Nội dung | Nguồn | Điều kiện sử dụng |
|---|---|---|
| Nhiệt độ và độ ẩm ngoài trời | Open-Meteo Forecast API — https://open-meteo.com/en/docs | Ghi nguồn Open-Meteo và CC BY 4.0. Backend cache 10 phút, timeout 8 giây. |
| Khí hậu lịch sử ngoài trời | NASA POWER Hourly API — https://power.larc.nasa.gov/docs/services/api/temporal/hourly/ | Ghi nguồn NASA POWER. Backend giới hạn 31 ngày và cache 24 giờ. |
| Video tham khảo | ICAR-IIHR trên YouTube — https://www.youtube.com/watch?v=oormRweSf3E | Chỉ nhúng bằng YouTube player; không tải lại hoặc phân phối lại. Có nút mở nguồn gốc nếu embed không phát. |
| Ảnh nấm bào ngư | Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Pleurotus_ostreatus_109117645.jpg | CC0 1.0; vẫn giữ attribution/source URL trong UI. |
| Hướng dẫn trồng nấm | Penn State Extension — https://extension.psu.edu/forage-and-food-crops/mushrooms/production-and-harvesting | Là tài liệu tham khảo, không tự động thay thế ngưỡng điều khiển thiết bị. |

## API nội bộ

Mọi endpoint yêu cầu JWT hợp lệ:

- `GET /api/external/weather/current`
- `GET /api/external/weather/history?start=YYYYMMDD&end=YYYYMMDD`
- `GET /api/reference/media`
- `GET /api/reference/cultivation-guides`

Không đưa API key vào frontend. Open-Meteo và NASA POWER hiện không cần key cho luồng đang dùng. Nếu đổi sang nguồn cần key, chỉ cấu hình ở backend `.env` và không commit file này.

## Khi không có phần cứng

Không nhập dữ liệu giả vào `sensor_readings`. UI phải hiện `CHƯA KẾT NỐI THIẾT BỊ` cho nhiệt độ, độ ẩm và CO2 trong phòng. Video Internet luôn có nhãn `VIDEO INTERNET`; camera vật lý không có stream luôn có nhãn `CHƯA KẾT NỐI`.

## Cấu hình vị trí thời tiết

Backend dùng mặc định tọa độ TP.HCM để demo. Có thể đặt `WEATHER_LATITUDE`, `WEATHER_LONGITUDE` và `WEATHER_TIMEZONE` trong `backend/.env` cho vị trí farm. Đây không phải secret, nhưng file `.env` vẫn không được commit.
