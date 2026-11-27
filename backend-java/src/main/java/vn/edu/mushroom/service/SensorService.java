package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.SensorIngestRequest;
import vn.edu.mushroom.dto.response.DashboardSummaryResponse;
import vn.edu.mushroom.dto.response.SensorReadingResponse;
import vn.edu.mushroom.entity.Device;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.SensorReading;
import vn.edu.mushroom.entity.Tray;
import vn.edu.mushroom.entity.enums.SensorType;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SensorService {

    private final SensorReadingRepository sensorReadingRepository;
    private final RoomRepository roomRepository;
    private final TrayRepository trayRepository;
    private final DeviceRepository deviceRepository;
    private final RentalRepository rentalRepository;
    private final AlertService alertService;

    @Transactional
    public Map<String, Object> ingestReading(SensorIngestRequest request) {
        Map<String, Object> response = new HashMap<>();

        // Deduplication check via message_id
        if (request.getMessage_id() != null && !request.getMessage_id().isBlank()) {
            if (sensorReadingRepository.existsByMessageId(request.getMessage_id().trim())) {
                response.put("duplicate", true);
                response.put("message", "Mẫu số liệu đã được ghi nhận trước đó (bỏ qua bản ghi trùng)");
                return response;
            }
        }

        SensorType metric = request.getSensor_type();
        BigDecimal value = request.getValue();

        if (metric == null || value == null) {
            throw AppException.badRequest("sensor_type và value là bắt buộc");
        }

        // Derive room_id if missing
        Integer roomId = request.getRoom_id();
        Tray tray = null;
        if (request.getTray_id() != null) {
            tray = trayRepository.findById(request.getTray_id()).orElse(null);
            if (roomId == null && tray != null && tray.getRoom() != null) {
                roomId = tray.getRoom().getId();
            }
        }

        Device device = null;
        if (request.getDevice_id() != null) {
            device = deviceRepository.findById(request.getDevice_id()).orElse(null);
            if (roomId == null && device != null && device.getRoom() != null) {
                roomId = device.getRoom().getId();
            }
        }

        Room room = roomId != null ? roomRepository.findById(roomId).orElse(null) : null;

        String unit = request.getUnit();
        if (unit == null || unit.isBlank()) {
            unit = metric == SensorType.TEMPERATURE ? "°C" : metric == SensorType.HUMIDITY ? "%" : "ppm";
        }

        SensorReading reading = SensorReading.builder()
                .room(room)
                .tray(tray)
                .device(device)
                .sensorType(metric)
                .value(value)
                .unit(unit)
                .messageId(request.getMessage_id() != null ? request.getMessage_id().trim() : null)
                .build();

        SensorReading saved = sensorReadingRepository.save(reading);

        // Evaluate against 2-consecutive-sample alert rules
        Map<String, Object> evalResult = null;
        if (room != null) {
            evalResult = alertService.evaluateReading(room.getId(), metric, value);
        }

        response.put("reading", SensorReadingResponse.fromEntity(saved));
        response.put("alertEvaluation", evalResult);
        return response;
    }

    /**
     * Ingestion handler for MQTT telemetry messages from ESP32.
     */
    @Transactional
    public void handleMqttTelemetry(Map<String, Object> data) {
        Integer roomId = parseInteger(data.get("room_id"));
        Integer trayId = parseInteger(data.get("tray_id"));
        Integer deviceId = parseInteger(data.get("device_id"));
        String messageId = (String) data.get("message_id");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> readingsList = (List<Map<String, Object>>) data.get("readings");

        if (readingsList != null && !readingsList.isEmpty()) {
            for (Map<String, Object> item : readingsList) {
                String metricStr = (String) (item.containsKey("metric") ? item.get("metric") : item.get("sensor_type"));
                BigDecimal val = parseBigDecimal(item.get("value"));
                String unit = (String) item.get("unit");

                if (metricStr != null && val != null) {
                    try {
                        SensorType type = SensorType.valueOf(metricStr.toUpperCase());
                        SensorIngestRequest req = new SensorIngestRequest();
                        req.setRoom_id(roomId);
                        req.setTray_id(trayId);
                        req.setDevice_id(deviceId);
                        req.setMessage_id(messageId != null ? messageId + "_" + type.name() : null);
                        req.setSensor_type(type);
                        req.setValue(val);
                        req.setUnit(unit);
                        ingestReading(req);
                    } catch (Exception ignored) {
                    }
                }
            }
        } else {
            String metricStr = (String) (data.containsKey("metric") ? data.get("metric") : data.get("sensor_type"));
            BigDecimal val = parseBigDecimal(data.get("value"));
            String unit = (String) data.get("unit");

            if (metricStr != null && val != null) {
                try {
                    SensorType type = SensorType.valueOf(metricStr.toUpperCase());
                    SensorIngestRequest req = new SensorIngestRequest();
                    req.setRoom_id(roomId);
                    req.setTray_id(trayId);
                    req.setDevice_id(deviceId);
                    req.setMessage_id(messageId);
                    req.setSensor_type(type);
                    req.setValue(val);
                    req.setUnit(unit);
                    ingestReading(req);
                } catch (Exception ignored) {
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<SensorReadingResponse> getSensorHistory(
            Integer roomId,
            Integer trayId,
            SensorType sensorType,
            OffsetDateTime from,
            OffsetDateTime to,
            int limit,
            Integer customerId,
            String role
    ) {
        // Customer IDOR check
        if ("CUSTOMER".equals(role)) {
            if (customerId == null) return List.of();
            if (roomId != null) {
                boolean hasLease = rentalRepository.hasCustomerActiveLeaseInRoom(customerId, roomId);
                if (!hasLease) {
                    return List.of();
                }
            }
        }

        int safeLimit = Math.min(Math.max(limit, 1), 1000);
        PageRequest pageRequest = PageRequest.of(0, safeLimit);

        List<SensorReading> list = sensorReadingRepository.findHistory(roomId, trayId, sensorType, from, to, pageRequest);
        return list.stream().map(SensorReadingResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse.EnvironmentStats getLatestReadings(Integer roomId) {
        DashboardSummaryResponse.EnvironmentStats stats = new DashboardSummaryResponse.EnvironmentStats();

        OffsetDateTime latestTime = null;

        Optional<SensorReading> tempOpt = sensorReadingRepository.findLatestBySensorTypeAndRoomId(SensorType.TEMPERATURE, roomId);
        if (tempOpt.isPresent()) {
            SensorReading r = tempOpt.get();
            stats.setTemperature(new DashboardSummaryResponse.MetricValue(r.getValue(), r.getUnit(), r.getRecordedAt()));
            latestTime = r.getRecordedAt();
        }

        Optional<SensorReading> humOpt = sensorReadingRepository.findLatestBySensorTypeAndRoomId(SensorType.HUMIDITY, roomId);
        if (humOpt.isPresent()) {
            SensorReading r = humOpt.get();
            stats.setHumidity(new DashboardSummaryResponse.MetricValue(r.getValue(), r.getUnit(), r.getRecordedAt()));
            if (latestTime == null || r.getRecordedAt().isAfter(latestTime)) {
                latestTime = r.getRecordedAt();
            }
        }

        Optional<SensorReading> co2Opt = sensorReadingRepository.findLatestBySensorTypeAndRoomId(SensorType.CO2, roomId);
        if (co2Opt.isPresent()) {
            SensorReading r = co2Opt.get();
            stats.setCo2(new DashboardSummaryResponse.MetricValue(r.getValue(), r.getUnit(), r.getRecordedAt()));
            if (latestTime == null || r.getRecordedAt().isAfter(latestTime)) {
                latestTime = r.getRecordedAt();
            }
        }

        stats.setLast_updated(latestTime);
        return stats;
    }

    private Integer parseInteger(Object val) {
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (Exception e) { return null; }
        }
        return null;
    }

    private BigDecimal parseBigDecimal(Object val) {
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        if (val instanceof String) {
            try { return new BigDecimal((String) val); } catch (Exception e) { return null; }
        }
        return null;
    }
}
