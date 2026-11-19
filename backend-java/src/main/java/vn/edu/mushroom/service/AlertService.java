package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.response.AlertResponse;
import vn.edu.mushroom.entity.Alert;
import vn.edu.mushroom.entity.ConsecutiveViolation;
import vn.edu.mushroom.entity.EnvThreshold;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.enums.AlertSeverity;
import vn.edu.mushroom.entity.enums.AlertStatus;
import vn.edu.mushroom.entity.enums.SensorType;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.AlertRepository;
import vn.edu.mushroom.repository.ConsecutiveViolationRepository;
import vn.edu.mushroom.repository.EnvThresholdRepository;
import vn.edu.mushroom.repository.RoomRepository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;
    private final EnvThresholdRepository thresholdRepository;
    private final ConsecutiveViolationRepository violationRepository;
    private final RoomRepository roomRepository;

    /**
     * Evaluates sensor reading against 2-consecutive-sample threshold alert rule.
     * SRS: 2 mẫu liên tiếp ngoài dải mới mở cảnh báo; dải bình thường auto-resolve.
     */
    @Transactional
    public Map<String, Object> evaluateReading(Integer roomId, SensorType metric, BigDecimal value) {
        Map<String, Object> evalResult = new HashMap<>();
        if (roomId == null || metric == null || value == null) {
            evalResult.put("status", "SKIPPED");
            return evalResult;
        }

        Optional<EnvThreshold> thresholdOpt = thresholdRepository.findByMetric(metric);
        if (thresholdOpt.isEmpty()) {
            evalResult.put("status", "UNCONFIGURED");
            evalResult.put("metric", metric);
            return evalResult;
        }

        EnvThreshold threshold = thresholdOpt.get();
        BigDecimal lower = threshold.getLowerBound();
        BigDecimal upper = threshold.getUpperBound();

        boolean isViolation = value.compareTo(lower) < 0 || value.compareTo(upper) > 0;

        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null) {
            evalResult.put("status", "SKIPPED");
            return evalResult;
        }

        ConsecutiveViolation violation = violationRepository.findByRoomIdAndMetric(roomId, metric)
                .orElse(ConsecutiveViolation.builder().room(room).metric(metric).count(0).build());

        int prevCount = violation.getCount() != null ? violation.getCount() : 0;

        if (isViolation) {
            int newCount = prevCount + 1;
            violation.setCount(newCount);
            violation.setLastValue(value);
            violation.setLastRecordedAt(OffsetDateTime.now());
            violationRepository.save(violation);

            if (newCount >= 2) {
                // Determine severity: DANGER if > 25% beyond threshold span
                BigDecimal span = upper.subtract(lower);
                BigDecimal margin = span.multiply(new BigDecimal("0.25"));
                boolean isExtreme = value.compareTo(lower.subtract(margin)) < 0 || value.compareTo(upper.add(margin)) > 0;
                AlertSeverity severity = isExtreme ? AlertSeverity.DANGER : AlertSeverity.WARNING;

                String title = "Cảnh báo " + metric + ": vượt ngưỡng (" + value + " " + threshold.getUnit() + ")";
                String message = "Chỉ số " + metric + " tại phòng đạt " + value + " " + threshold.getUnit() +
                        ", liên tiếp " + newCount + " lần nằm ngoài dải an toàn [" + lower + " - " + upper + " " + threshold.getUnit() + "].";

                Optional<Alert> existingActiveAlert = alertRepository.findActiveByRoomIdAndMetric(roomId, metric);
                Alert alert;
                if (existingActiveAlert.isPresent()) {
                    alert = existingActiveAlert.get();
                    alert.setMessage(message);
                    alert.setSeverity(severity);
                    alert.setIsRead(false);
                } else {
                    alert = Alert.builder()
                            .room(room)
                            .metric(metric)
                            .severity(severity)
                            .title(title)
                            .message(message)
                            .status(AlertStatus.ACTIVE)
                            .isRead(false)
                            .build();
                }
                Alert savedAlert = alertRepository.save(alert);

                evalResult.put("status", "ALERT_GENERATED");
                evalResult.put("alertId", savedAlert.getId());
                evalResult.put("violationCount", newCount);
                evalResult.put("metric", metric);
                evalResult.put("value", value);
                return evalResult;
            }

            // 1st sample violation — no alert yet
            evalResult.put("status", "FIRST_VIOLATION_PENDING_CONFIRMATION");
            evalResult.put("violationCount", 1);
            evalResult.put("metric", metric);
            evalResult.put("value", value);
            return evalResult;
        } else {
            // Normal reading
            if (prevCount > 0) {
                violation.setCount(0);
                violation.setLastValue(value);
                violation.setLastRecordedAt(OffsetDateTime.now());
                violationRepository.save(violation);
            }

            // Auto-resolve any active alert
            alertRepository.findActiveByRoomIdAndMetric(roomId, metric).ifPresent(activeAlert -> {
                activeAlert.setStatus(AlertStatus.RESOLVED);
                activeAlert.setResolvedAt(OffsetDateTime.now());
                alertRepository.save(activeAlert);
            });

            evalResult.put("status", "NORMAL");
            evalResult.put("metric", metric);
            evalResult.put("value", value);
            return evalResult;
        }
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> listAlerts(
            Integer roomId,
            AlertSeverity severity,
            AlertStatus status,
            Boolean isRead,
            int limit,
            int offset,
            Integer customerId,
            String role
    ) {
        int page = offset / Math.max(limit, 1);
        PageRequest pageRequest = PageRequest.of(page, Math.max(limit, 1));

        List<Alert> alerts;
        if ("CUSTOMER".equals(role)) {
            if (customerId == null) return List.of();
            alerts = alertRepository.findAlertsForCustomer(customerId, roomId, severity, status, isRead, pageRequest);
        } else {
            alerts = alertRepository.findAlerts(roomId, severity, status, isRead, pageRequest);
        }

        return alerts.stream().map(AlertResponse::fromEntity).toList();
    }

    @Transactional
    public AlertResponse markAsRead(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> AppException.notFound("Cảnh báo không tồn tại"));

        alert.setIsRead(true);
        return AlertResponse.fromEntity(alertRepository.save(alert));
    }

    @Transactional
    public AlertResponse resolveAlert(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> AppException.notFound("Cảnh báo không tồn tại"));

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(OffsetDateTime.now());
        return AlertResponse.fromEntity(alertRepository.save(alert));
    }
}
