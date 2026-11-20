package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.response.DashboardSummaryResponse;
import vn.edu.mushroom.entity.Rental;
import vn.edu.mushroom.entity.enums.AlertStatus;
import vn.edu.mushroom.entity.enums.RentalStatus;
import vn.edu.mushroom.entity.enums.RoomStatus;
import vn.edu.mushroom.entity.enums.TrayStatus;
import vn.edu.mushroom.repository.*;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final RoomRepository roomRepository;
    private final TrayRepository trayRepository;
    private final DeviceRepository deviceRepository;
    private final RentalRepository rentalRepository;
    private final AlertRepository alertRepository;
    private final SensorService sensorService;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        long totalRooms = roomRepository.countByIsArchivedFalse();
        long activeRooms = roomRepository.countByStatusAndIsArchivedFalse(RoomStatus.ACTIVE);

        long totalTrays = trayRepository.countByIsArchivedFalse();
        long rentedTrays = trayRepository.countByStatusAndIsArchivedFalse(TrayStatus.RENTED);
        long availableTrays = trayRepository.countByStatusAndIsArchivedFalse(TrayStatus.AVAILABLE);

        long totalDevices = deviceRepository.count();
        long onDevices = deviceRepository.countByIsOnTrue();

        long activeRentals = rentalRepository.countByStatus(RentalStatus.ACTIVE);
        long pendingRentals = rentalRepository.countByStatus(RentalStatus.PENDING);

        long unreadAlerts = alertRepository.countByStatusAndIsReadFalse(AlertStatus.ACTIVE);

        DashboardSummaryResponse.EnvironmentStats envStats = sensorService.getLatestReadings(null);

        // Recent activity
        List<Rental> recentRentals = rentalRepository.findRentalsWithFilters(null, null);
        List<Map<String, Object>> activities = new ArrayList<>();
        recentRentals.stream().limit(5).forEach(r -> {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "rental");
            item.put("id", r.getId());
            item.put("actor", r.getCustomer() != null ? r.getCustomer().getFullName() : "Khách hàng");
            item.put("status", r.getStatus() != null ? r.getStatus().name() : "");
            item.put("ts", r.getUpdatedAt() != null ? r.getUpdatedAt() : r.getCreatedAt());
            activities.add(item);
        });

        return DashboardSummaryResponse.builder()
                .rooms(DashboardSummaryResponse.RoomStats.builder().total(totalRooms).active(activeRooms).build())
                .trays(DashboardSummaryResponse.TrayStats.builder().total(totalTrays).rented(rentedTrays).available(availableTrays).build())
                .devices(DashboardSummaryResponse.DeviceStats.builder().total(totalDevices).on(onDevices).build())
                .rentals(DashboardSummaryResponse.RentalStats.builder().active(activeRentals).pending(pendingRentals).build())
                .unread_alerts(unreadAlerts)
                .environment(envStats)
                .recent_activity(activities)
                .backend("connected")
                .build();
    }
}
