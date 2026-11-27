package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.TrayRequest;
import vn.edu.mushroom.dto.request.UpdateStageRequest;
import vn.edu.mushroom.dto.response.GrowthLogResponse;
import vn.edu.mushroom.dto.response.TrayResponse;
import vn.edu.mushroom.entity.*;
import vn.edu.mushroom.entity.enums.GrowthStage;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.TrayStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TrayService {

    private final TrayRepository trayRepository;
    private final RoomRepository roomRepository;
    private final RentalPackageRepository packageRepository;
    private final RentalRepository rentalRepository;
    private final HarvestRepository harvestRepository;
    private final GrowthLogRepository growthLogRepository;
    private final UserRepository userRepository;

    private static final List<GrowthStage> STAGE_ORDER = List.of(
            GrowthStage.PREPARATION,
            GrowthStage.INCUBATION,
            GrowthStage.FRUITING,
            GrowthStage.READY_TO_HARVEST,
            GrowthStage.HARVESTED,
            GrowthStage.COMPLETED
    );

    @Transactional(readOnly = true)
    public List<TrayResponse> listTrays(Integer roomId, TrayStatus status, GrowthStage growthStage, Integer customerId, String role) {
        List<Tray> trays;
        if ("CUSTOMER".equals(role)) {
            if (customerId == null) return List.of();
            trays = trayRepository.findCustomerActiveTrays(customerId, roomId, status, growthStage);
        } else {
            trays = trayRepository.findAllWithFilters(roomId, status, growthStage);
        }
        return trays.stream().map(TrayResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public TrayResponse getTrayById(Integer id, Integer customerId, String role) {
        Tray tray = trayRepository.findById(id)
                .filter(t -> !t.getIsArchived())
                .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));

        if ("CUSTOMER".equals(role)) {
            // Check if customer owns an active lease for this tray
            long count = rentalRepository.countActiveByTrayId(id);
            if (count == 0) {
                throw AppException.forbidden("Bạn không có quyền truy cập thông tin khay trồng này");
            }
        }

        return TrayResponse.fromEntity(tray);
    }

    @Transactional
    public TrayResponse createTray(TrayRequest request) {
        String code = request.getCode().trim();
        if (trayRepository.existsByCode(code)) {
            throw AppException.conflict("Mã khay đã tồn tại trong hệ thống");
        }

        Room room = null;
        if (request.getRoom_id() != null) {
            room = roomRepository.findById(request.getRoom_id())
                    .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));
        }

        RentalPackage pkg = null;
        if (request.getPackage_id() != null) {
            pkg = packageRepository.findById(request.getPackage_id())
                    .orElseThrow(() -> AppException.notFound("Gói thuê không tồn tại"));
        }

        Tray tray = Tray.builder()
                .code(code)
                .room(room)
                .rentalPackage(pkg)
                .status(request.getStatus() != null ? request.getStatus() : TrayStatus.AVAILABLE)
                .growthStage(GrowthStage.PREPARATION)
                .growthDay(request.getGrowth_day() != null ? request.getGrowth_day() : 1)
                .growthTotalDays(request.getGrowth_total_days() != null ? request.getGrowth_total_days() : 30)
                .mushroomVariety(request.getMushroom_variety() != null ? request.getMushroom_variety().trim() : "Nấm Bào Ngư Xám")
                .isArchived(false)
                .build();

        return TrayResponse.fromEntity(trayRepository.save(tray));
    }

    @Transactional
    public TrayResponse updateTray(Integer id, TrayRequest request) {
        Tray tray = trayRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));

        if (request.getCode() != null) {
            String newCode = request.getCode().trim();
            if (!newCode.equals(tray.getCode()) && trayRepository.existsByCode(newCode)) {
                throw AppException.conflict("Mã khay đã tồn tại trong hệ thống");
            }
            tray.setCode(newCode);
        }

        if (request.getRoom_id() != null) {
            Room room = roomRepository.findById(request.getRoom_id())
                    .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));
            tray.setRoom(room);
        }

        if (request.getPackage_id() != null) {
            RentalPackage pkg = packageRepository.findById(request.getPackage_id())
                    .orElseThrow(() -> AppException.notFound("Gói thuê không tồn tại"));
            tray.setRentalPackage(pkg);
        }

        if (request.getStatus() != null) tray.setStatus(request.getStatus());
        if (request.getGrowth_day() != null) tray.setGrowthDay(request.getGrowth_day());
        if (request.getGrowth_total_days() != null) tray.setGrowthTotalDays(request.getGrowth_total_days());
        if (request.getMushroom_variety() != null) tray.setMushroomVariety(request.getMushroom_variety().trim());

        return TrayResponse.fromEntity(trayRepository.save(tray));
    }

    @Transactional
    public Map<String, Object> deleteTray(Integer id) {
        Tray tray = trayRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));

        long activeRentals = rentalRepository.countActiveByTrayId(id);
        long harvests = harvestRepository.countByTrayId(id);

        Map<String, Object> result = new HashMap<>();
        if (activeRentals > 0 || harvests > 0) {
            tray.setIsArchived(true);
            tray.setStatus(TrayStatus.MAINTENANCE);
            trayRepository.save(tray);
            result.put("message", "Khay đang có hợp đồng hoặc lịch sử thu hoạch, đã lưu trữ thay vì xóa cứng.");
            result.put("archived", true);
        } else {
            trayRepository.delete(tray);
            result.put("message", "Xóa khay thành công");
            result.put("archived", false);
        }
        return result;
    }

    @Transactional
    public TrayResponse updateStage(Integer id, UpdateStageRequest request, Integer userId) {
        Tray tray = trayRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Khay trồng không tồn tại"));

        GrowthStage currentStage = tray.getGrowthStage() != null ? tray.getGrowthStage() : GrowthStage.PREPARATION;
        GrowthStage newStage = request.getStage();

        int currentIndex = STAGE_ORDER.indexOf(currentStage);
        int newIndex = STAGE_ORDER.indexOf(newStage);

        if (newIndex < currentIndex) {
            throw AppException.badRequest("Không thể quay lại giai đoạn trước từ " + currentStage + " về " + newStage);
        }

        tray.setGrowthStage(newStage);
        Tray updated = trayRepository.save(tray);

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

        GrowthLog log = GrowthLog.builder()
                .tray(updated)
                .stage(newStage)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .createdBy(user)
                .build();
        growthLogRepository.save(log);

        return TrayResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<GrowthLogResponse> getGrowthLogs(Integer trayId) {
        return growthLogRepository.findByTrayIdOrderByCreatedAtAsc(trayId).stream()
                .map(GrowthLogResponse::fromEntity)
                .toList();
    }
}
