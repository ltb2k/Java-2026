package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.ThresholdRequest;
import vn.edu.mushroom.dto.response.ThresholdResponse;
import vn.edu.mushroom.entity.EnvThreshold;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.SensorType;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.EnvThresholdRepository;
import vn.edu.mushroom.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ThresholdService {

    private final EnvThresholdRepository thresholdRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ThresholdResponse> listThresholds() {
        return thresholdRepository.findAll().stream()
                .map(ThresholdResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ThresholdResponse getThreshold(SensorType metric) {
        EnvThreshold threshold = thresholdRepository.findByMetric(metric)
                .orElseThrow(() -> AppException.notFound("Ngưỡng cho chỉ số " + metric + " chưa được thiết lập"));
        return ThresholdResponse.fromEntity(threshold);
    }

    @Transactional
    public ThresholdResponse updateThreshold(SensorType metric, ThresholdRequest request, Integer userId) {
        BigDecimal lower = request.getLower_bound();
        BigDecimal upper = request.getUpper_bound();

        if (lower.compareTo(upper) >= 0) {
            throw AppException.badRequest("Ngưỡng dưới (lower_bound) phải nhỏ hơn ngưỡng trên (upper_bound)");
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        EnvThreshold threshold = thresholdRepository.findByMetric(metric)
                .orElse(EnvThreshold.builder().metric(metric).build());

        threshold.setLowerBound(lower);
        threshold.setUpperBound(upper);
        if (request.getUnit() != null) {
            threshold.setUnit(request.getUnit().trim());
        } else if (threshold.getUnit() == null) {
            threshold.setUnit(metric == SensorType.TEMPERATURE ? "°C" : metric == SensorType.HUMIDITY ? "%" : "ppm");
        }
        threshold.setUpdatedBy(user);

        return ThresholdResponse.fromEntity(thresholdRepository.save(threshold));
    }
}
