package vn.edu.mushroom.dto.request;

import lombok.Data;
import vn.edu.mushroom.entity.enums.SensorType;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SensorIngestRequest {
    private Integer room_id;
    private Integer tray_id;
    private Integer device_id;
    private String message_id;
    private SensorType sensor_type;
    private BigDecimal value;
    private String unit;
    private List<SensorReadingItem> readings;

    @Data
    public static class SensorReadingItem {
        private SensorType metric;
        private SensorType sensor_type;
        private BigDecimal value;
        private String unit;
    }
}
