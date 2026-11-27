package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.Rental;
import vn.edu.mushroom.entity.enums.RentalStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalResponse {
    private Integer id;
    private Integer customer_id;
    private Integer package_id;
    private Integer tray_id;
    private Integer quantity;
    private RentalStatus status;
    private LocalDate start_date;
    private LocalDate end_date;
    private String notes;
    private String rejection_reason;
    private Integer approved_by;
    private OffsetDateTime approved_at;
    private String customer_name;
    private String customer_email;
    private String package_name;
    private Integer duration_days;
    private BigDecimal package_price;
    private String approved_by_name;
    @Builder.Default
    private List<TraySimpleDto> trays = new ArrayList<>();
    private String active_link_code;
    private OffsetDateTime link_code_expires_at;
    private OffsetDateTime link_code_used_at;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TraySimpleDto {
        private Integer id;
        private String code;
        private Integer room_id;
        private String status;
        private String growth_stage;
    }

    public static RentalResponse fromEntity(Rental rental) {
        if (rental == null) return null;
        List<TraySimpleDto> trayDtos = new ArrayList<>();
        if (rental.getAssignedTrays() != null) {
            rental.getAssignedTrays().forEach(t -> {
                trayDtos.add(TraySimpleDto.builder()
                        .id(t.getId())
                        .code(t.getCode())
                        .room_id(t.getRoom() != null ? t.getRoom().getId() : null)
                        .status(t.getStatus() != null ? t.getStatus().name() : null)
                        .growth_stage(t.getGrowthStage() != null ? t.getGrowthStage().name() : null)
                        .build());
            });
        }

        return RentalResponse.builder()
                .id(rental.getId())
                .customer_id(rental.getCustomer() != null ? rental.getCustomer().getId() : null)
                .package_id(rental.getRentalPackage() != null ? rental.getRentalPackage().getId() : null)
                .tray_id(rental.getPrimaryTray() != null ? rental.getPrimaryTray().getId() : null)
                .quantity(rental.getQuantity())
                .status(rental.getStatus())
                .start_date(rental.getStartDate())
                .end_date(rental.getEndDate())
                .notes(rental.getNotes())
                .rejection_reason(rental.getRejectionReason())
                .approved_by(rental.getApprovedBy() != null ? rental.getApprovedBy().getId() : null)
                .approved_at(rental.getApprovedAt())
                .customer_name(rental.getCustomer() != null ? rental.getCustomer().getFullName() : null)
                .customer_email(rental.getCustomer() != null ? rental.getCustomer().getEmail() : null)
                .package_name(rental.getRentalPackage() != null ? rental.getRentalPackage().getName() : null)
                .duration_days(rental.getRentalPackage() != null ? rental.getRentalPackage().getDurationDays() : null)
                .package_price(rental.getRentalPackage() != null ? rental.getRentalPackage().getPrice() : null)
                .approved_by_name(rental.getApprovedBy() != null ? rental.getApprovedBy().getFullName() : null)
                .trays(trayDtos)
                .created_at(rental.getCreatedAt())
                .updated_at(rental.getUpdatedAt())
                .build();
    }
}
