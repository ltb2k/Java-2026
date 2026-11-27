package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.HarvestPlanRequest;
import vn.edu.mushroom.dto.request.HarvestRecordRequest;
import vn.edu.mushroom.dto.response.HarvestResponse;
import vn.edu.mushroom.entity.*;
import vn.edu.mushroom.entity.enums.GrowthStage;
import vn.edu.mushroom.entity.enums.HarvestStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HarvestService {

    private final HarvestRepository harvestRepository;
    private final TrayRepository trayRepository;
    private final UserRepository userRepository;
    private final RentalRepository rentalRepository;
    private final GrowthLogRepository growthLogRepository;

    @Transactional(readOnly = true)
    public List<HarvestResponse> listHarvests(Integer trayId, HarvestStatus status, Integer customerId, String role) {
        List<Harvest> list;
        if ("CUSTOMER".equals(role)) {
            if (customerId == null) return List.of();
            list = harvestRepository.findHarvestsForCustomer(customerId, trayId, status);
        } else {
            list = harvestRepository.findHarvests(trayId, status);
        }
        return list.stream().map(HarvestResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public HarvestResponse getHarvestById(Integer id, Integer customerId, String role) {
        Harvest harvest = harvestRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Bản ghi thu hoạch không tồn tại"));

        if ("CUSTOMER".equals(role)) {
            if (harvest.getTray() != null) {
                long activeCount = rentalRepository.countActiveByTrayId(harvest.getTray().getId());
                if (activeCount == 0) {
                    throw AppException.forbidden("Bạn không có quyền truy cập bản ghi thu hoạch này");
                }
            }
        }

        return HarvestResponse.fromEntity(harvest);
    }

    @Transactional
    public HarvestResponse createHarvestPlan(HarvestPlanRequest request, Integer userId) {
        Tray tray = trayRepository.findById(request.getTray_id())
                .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        Harvest harvest = Harvest.builder()
                .tray(tray)
                .plannedDate(request.getPlanned_date())
                .status(HarvestStatus.PLANNED)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .recordedBy(user)
                .build();

        return HarvestResponse.fromEntity(harvestRepository.save(harvest));
    }

    @Transactional
    public HarvestResponse recordHarvest(Integer id, HarvestRecordRequest request, Integer userId) {
        Harvest harvest = harvestRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Bản ghi thu hoạch không tồn tại"));

        BigDecimal qty = request.getQuantity_kg();
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw AppException.badRequest("Sản lượng thu hoạch (kg) phải lớn hơn 0");
        }

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        LocalDate harvestDate = request.getHarvest_date() != null ? request.getHarvest_date() : LocalDate.now();
        String qualityGrade = request.getQuality_grade() != null ? request.getQuality_grade().trim() : "STANDARD";

        harvest.setQuantityKg(qty);
        harvest.setQualityGrade(qualityGrade);
        harvest.setHarvestDate(harvestDate);
        harvest.setStatus(HarvestStatus.COMPLETED);
        if (request.getNotes() != null) harvest.setNotes(request.getNotes().trim());
        harvest.setRecordedBy(user);

        Harvest savedHarvest = harvestRepository.save(harvest);

        // Update tray status and growth stage
        Tray tray = harvest.getTray();
        if (tray != null) {
            tray.setGrowthStage(GrowthStage.HARVESTED);
            trayRepository.save(tray);

            GrowthLog log = GrowthLog.builder()
                    .tray(tray)
                    .stage(GrowthStage.HARVESTED)
                    .notes("Thu hoạch hoàn tất: " + qty + " kg (chất lượng: " + qualityGrade + ")")
                    .createdBy(user)
                    .build();
            growthLogRepository.save(log);
        }

        return HarvestResponse.fromEntity(savedHarvest);
    }
}
