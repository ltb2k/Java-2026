package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.EnvThreshold;
import vn.edu.mushroom.entity.enums.SensorType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThresholdResponse {
    private Integer id;
    private SensorType metric;
    private BigDecimal lower_bound;
    private BigDecimal upper_bound;
    private String unit;
    private Integer updated_by;
    private String updated_by_name;
    private OffsetDateTime updated_at;

    public static ThresholdResponse fromEntity(EnvThreshold et) {
        if (et == null) return null;
        return ThresholdResponse.builder()
                .id(et.getId())
                .metric(et.getMetric())
                .lower_bound(et.getLowerBound())
                .upper_bound(et.getUpperBound())
                .unit(et.getUnit())
                .updated_by(et.getUpdatedBy() != null ? et.getUpdatedBy().getId() : null)
                .updated_by_name(et.getUpdatedBy() != null ? et.getUpdatedBy().getFullName() : null)
                .updated_at(et.getUpdatedAt())
                .build();
    }
}
