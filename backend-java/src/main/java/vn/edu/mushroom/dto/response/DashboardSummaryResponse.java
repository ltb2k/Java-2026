package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private RoomStats rooms;
    private TrayStats trays;
    private DeviceStats devices;
    private RentalStats rentals;
    private Long unread_alerts;
    private EnvironmentStats environment;
    private List<Map<String, Object>> recent_activity;
    @Builder.Default
    private String backend = "connected";

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomStats {
        private Long total;
        private Long active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrayStats {
        private Long total;
        private Long rented;
        private Long available;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceStats {
        private Long total;
        private Long on;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RentalStats {
        private Long active;
        private Long pending;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnvironmentStats {
        private MetricValue temperature;
        private MetricValue humidity;
        private MetricValue co2;
        private OffsetDateTime last_updated;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricValue {
        private BigDecimal value;
        private String unit;
        private OffsetDateTime recorded_at;
    }
}
