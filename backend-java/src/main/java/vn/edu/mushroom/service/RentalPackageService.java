package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.RentalPackageRequest;
import vn.edu.mushroom.entity.RentalPackage;
import vn.edu.mushroom.entity.enums.PackageStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.RentalPackageRepository;
import vn.edu.mushroom.repository.RentalRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RentalPackageService {

    private final RentalPackageRepository packageRepository;
    private final RentalRepository rentalRepository;

    @Transactional(readOnly = true)
    public List<RentalPackage> listPackages(boolean activeOnly) {
        if (activeOnly) {
            return packageRepository.findByStatusOrderByPriceAsc(PackageStatus.ACTIVE);
        }
        return packageRepository.findAllByOrderByPriceAsc();
    }

    @Transactional(readOnly = true)
    public RentalPackage getPackageById(Integer id) {
        return packageRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Gói thuê không tồn tại"));
    }

    @Transactional
    public RentalPackage createPackage(RentalPackageRequest request) {
        RentalPackage pkg = RentalPackage.builder()
                .name(request.getName().trim())
                .durationDays(request.getDuration_days())
                .price(request.getPrice())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .status(request.getStatus() != null ? request.getStatus() : PackageStatus.ACTIVE)
                .build();

        return packageRepository.save(pkg);
    }

    @Transactional
    public RentalPackage updatePackage(Integer id, RentalPackageRequest request) {
        RentalPackage pkg = getPackageById(id);

        if (request.getName() != null) pkg.setName(request.getName().trim());
        if (request.getDuration_days() != null) pkg.setDurationDays(request.getDuration_days());
        if (request.getPrice() != null) pkg.setPrice(request.getPrice());
        if (request.getDescription() != null) pkg.setDescription(request.getDescription().trim());
        if (request.getStatus() != null) pkg.setStatus(request.getStatus());

        return packageRepository.save(pkg);
    }

    @Transactional
    public Map<String, Object> deletePackage(Integer id) {
        RentalPackage pkg = getPackageById(id);

        long activeCount = rentalRepository.countActiveByPackageId(id);
        Map<String, Object> result = new HashMap<>();

        if (activeCount > 0) {
            pkg.setStatus(PackageStatus.INACTIVE);
            packageRepository.save(pkg);
            result.put("message", "Gói thuê đang được sử dụng bởi các hợp đồng thuê, đã chuyển sang trạng thái Ngưng hoạt động (INACTIVE).");
            result.put("deactivated", true);
        } else {
            packageRepository.delete(pkg);
            result.put("message", "Xóa gói thuê thành công");
            result.put("deactivated", false);
        }
        return result;
    }
}
