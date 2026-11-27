package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.AssignTraysRequest;
import vn.edu.mushroom.dto.request.CancelRentalRequest;
import vn.edu.mushroom.dto.request.RejectRentalRequest;
import vn.edu.mushroom.dto.request.RentalRequest;
import vn.edu.mushroom.dto.response.RentalResponse;
import vn.edu.mushroom.entity.*;
import vn.edu.mushroom.entity.enums.PackageStatus;
import vn.edu.mushroom.entity.enums.RentalStatus;
import vn.edu.mushroom.entity.enums.TrayStatus;
import vn.edu.mushroom.entity.enums.UserStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.*;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RentalService {

    private final RentalRepository rentalRepository;
    private final UserRepository userRepository;
    private final RentalPackageRepository packageRepository;
    private final TrayRepository trayRepository;
    private final LinkCodeRepository linkCodeRepository;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateLinkCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    @Transactional
    public RentalResponse requestRental(Integer customerId, RentalRequest request) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> AppException.notFound("Khách hàng không tồn tại"));

        if (!customer.getIsActive() || customer.getStatus() == UserStatus.DISABLED) {
            throw AppException.forbidden("Tài khoản không đủ điều kiện thuê khay");
        }

        RentalPackage pkg = packageRepository.findById(request.getPackage_id())
                .orElseThrow(() -> AppException.notFound("Gói thuê đã chọn không tồn tại"));

        if (pkg.getStatus() != PackageStatus.ACTIVE) {
            throw AppException.badRequest("Gói thuê đã chọn không tồn tại hoặc đã ngưng hoạt động");
        }

        int qty = request.getQuantity() != null ? request.getQuantity() : 1;
        if (qty < 1 || qty > 5) {
            throw AppException.badRequest("Số lượng khay thuê phải từ 1 đến 5 khay");
        }

        Rental rental = Rental.builder()
                .customer(customer)
                .rentalPackage(pkg)
                .quantity(qty)
                .status(RentalStatus.PENDING)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .build();

        return RentalResponse.fromEntity(rentalRepository.save(rental));
    }

    @Transactional(readOnly = true)
    public List<RentalResponse> listRentals(Integer customerId, RentalStatus status, String role) {
        Integer filterCustomerId = "CUSTOMER".equals(role) ? customerId : null;
        List<Rental> rentals = rentalRepository.findRentalsWithFilters(filterCustomerId, status);

        return rentals.stream().map(r -> {
            RentalResponse resp = RentalResponse.fromEntity(r);
            linkCodeRepository.findActiveByRentalId(r.getId()).ifPresent(lc -> {
                resp.setActive_link_code(lc.getCode());
                resp.setLink_code_expires_at(lc.getExpiresAt());
            });
            return resp;
        }).toList();
    }

    @Transactional(readOnly = true)
    public RentalResponse getRentalById(Integer id, Integer customerId, String role) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Yêu cầu thuê không tồn tại"));

        if ("CUSTOMER".equals(role) && !rental.getCustomer().getId().equals(customerId)) {
            throw AppException.forbidden("Bạn không có quyền truy cập yêu cầu thuê này");
        }

        RentalResponse resp = RentalResponse.fromEntity(rental);
        linkCodeRepository.findActiveByRentalId(rental.getId()).ifPresent(lc -> {
            resp.setActive_link_code(lc.getCode());
            resp.setLink_code_expires_at(lc.getExpiresAt());
            resp.setLink_code_used_at(lc.getUsedAt());
        });
        return resp;
    }

    @Transactional
    public RentalResponse approveRental(Integer rentalId, Integer staffId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> AppException.notFound("Yêu cầu thuê không tồn tại"));

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw AppException.badRequest("Chỉ có thể duyệt yêu cầu ở trạng thái PENDING. Trạng thái hiện tại: " + rental.getStatus());
        }

        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;
        rental.setStatus(RentalStatus.APPROVED);
        rental.setApprovedBy(staff);
        rental.setApprovedAt(OffsetDateTime.now());

        return RentalResponse.fromEntity(rentalRepository.save(rental));
    }

    @Transactional
    public RentalResponse rejectRental(Integer rentalId, Integer staffId, RejectRentalRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> AppException.notFound("Yêu cầu thuê không tồn tại"));

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw AppException.badRequest("Chỉ có thể từ chối yêu cầu ở trạng thái PENDING. Trạng thái hiện tại: " + rental.getStatus());
        }

        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;
        rental.setStatus(RentalStatus.REJECTED);
        rental.setApprovedBy(staff);
        rental.setApprovedAt(OffsetDateTime.now());
        rental.setRejectionReason(request != null && request.getReason() != null ? request.getReason().trim() : "Yêu cầu bị từ chối");

        return RentalResponse.fromEntity(rentalRepository.save(rental));
    }

    @Transactional
    public Map<String, Object> assignTrays(Integer rentalId, Integer staffId, AssignTraysRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> AppException.notFound("Yêu cầu thuê không tồn tại"));

        if (rental.getStatus() != RentalStatus.APPROVED && rental.getStatus() != RentalStatus.PENDING) {
            throw AppException.badRequest("Không thể gán khay cho yêu cầu ở trạng thái " + rental.getStatus());
        }

        List<Integer> trayIds = request.getTray_ids();
        List<Tray> trays = trayRepository.findAllById(trayIds);

        if (trays.size() != trayIds.size()) {
            throw AppException.badRequest("Một hoặc nhiều khay không tồn tại");
        }

        for (Tray tray : trays) {
            if (tray.getIsArchived() || tray.getStatus() != TrayStatus.AVAILABLE) {
                throw AppException.badRequest("Khay " + tray.getCode() + " không ở trạng thái sẵn sàng (AVAILABLE) để gán");
            }
        }

        // Update trays to ASSIGNED
        trays.forEach(t -> t.setStatus(TrayStatus.ASSIGNED));
        trayRepository.saveAll(trays);

        User staff = staffId != null ? userRepository.findById(staffId).orElse(null) : null;
        rental.setStatus(RentalStatus.ASSIGNED);
        if (rental.getApprovedBy() == null) {
            rental.setApprovedBy(staff);
            rental.setApprovedAt(OffsetDateTime.now());
        }
        rental.setPrimaryTray(trays.get(0));
        rental.setAssignedTrays(new HashSet<>(trays));
        Rental savedRental = rentalRepository.save(rental);

        // Generate link code valid for 24h
        String code = generateLinkCode();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(24);

        LinkCode linkCode = LinkCode.builder()
                .rental(savedRental)
                .code(code)
                .expiresAt(expiresAt)
                .build();
        linkCodeRepository.save(linkCode);

        Map<String, Object> result = new HashMap<>();
        result.put("rental", RentalResponse.fromEntity(savedRental));
        result.put("link_code", code);
        result.put("expires_at", expiresAt);
        return result;
    }

    @Transactional
    public RentalResponse linkWithCode(Integer customerId, String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw AppException.badRequest("Vui lòng nhập mã liên kết hợp lệ");
        }

        String code = rawCode.toUpperCase().trim();
        LinkCode linkCode = linkCodeRepository.findByCode(code)
                .orElseThrow(() -> AppException.notFound("Mã liên kết không tồn tại"));

        if (linkCode.isUsed()) {
            throw AppException.badRequest("Mã liên kết này đã được sử dụng trước đó");
        }

        if (linkCode.isExpired()) {
            throw AppException.badRequest("Mã liên kết đã hết hạn (chỉ có hiệu lực trong vòng 24 giờ kể từ khi cấp)");
        }

        Rental rental = linkCode.getRental();
        if (!rental.getCustomer().getId().equals(customerId)) {
            throw AppException.forbidden("Mã liên kết này không thuộc về tài khoản của bạn");
        }

        if (rental.getStatus() != RentalStatus.ASSIGNED) {
            throw AppException.badRequest("Hợp đồng thuê không ở trạng thái chờ liên kết (ASSIGNED). Trạng thái hiện tại: " + rental.getStatus());
        }

        // Mark code used
        linkCode.setUsedAt(OffsetDateTime.now());
        linkCodeRepository.save(linkCode);

        // Calculate lease period
        int durationDays = rental.getRentalPackage() != null ? rental.getRentalPackage().getDurationDays() : 30;
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(durationDays);

        rental.setStatus(RentalStatus.ACTIVE);
        rental.setStartDate(startDate);
        rental.setEndDate(endDate);
        Rental activeRental = rentalRepository.save(rental);

        // Update assigned trays to RENTED
        if (activeRental.getAssignedTrays() != null) {
            activeRental.getAssignedTrays().forEach(t -> t.setStatus(TrayStatus.RENTED));
            trayRepository.saveAll(activeRental.getAssignedTrays());
        }

        return RentalResponse.fromEntity(activeRental);
    }

    @Transactional
    public RentalResponse cancelRental(Integer rentalId, Integer userId, String role, CancelRentalRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> AppException.notFound("Yêu cầu thuê không tồn tại"));

        if ("CUSTOMER".equals(role)) {
            if (!rental.getCustomer().getId().equals(userId)) {
                throw AppException.forbidden("Bạn không có quyền hủy yêu cầu này");
            }
            if (rental.getStatus() != RentalStatus.PENDING) {
                throw AppException.badRequest("Khách hàng chỉ có thể hủy yêu cầu khi đang ở trạng thái PENDING");
            }
        }

        // Release trays back to AVAILABLE
        if (rental.getAssignedTrays() != null) {
            rental.getAssignedTrays().forEach(t -> t.setStatus(TrayStatus.AVAILABLE));
            trayRepository.saveAll(rental.getAssignedTrays());
        }

        rental.setStatus(RentalStatus.CANCELLED);
        rental.setRejectionReason(request != null && request.getReason() != null ? request.getReason().trim() : "Đã hủy theo yêu cầu");

        return RentalResponse.fromEntity(rentalRepository.save(rental));
    }
}
