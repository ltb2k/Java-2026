package vn.edu.mushroom;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.AssignTraysRequest;
import vn.edu.mushroom.dto.request.RentalRequest;
import vn.edu.mushroom.dto.response.RentalResponse;
import vn.edu.mushroom.entity.*;
import vn.edu.mushroom.entity.enums.*;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.*;
import vn.edu.mushroom.service.RentalService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RentalServiceTest {

    @Autowired
    private RentalService rentalService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RentalPackageRepository packageRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private TrayRepository trayRepository;

    @Autowired
    private RentalRepository rentalRepository;

    @Autowired
    private LinkCodeRepository linkCodeRepository;

    private User customer;
    private User operator;
    private RentalPackage rentalPackage;
    private Tray tray1;
    private Tray tray2;

    @BeforeEach
    void setUp() {
        linkCodeRepository.deleteAll();
        rentalRepository.deleteAll();
        trayRepository.deleteAll();
        roomRepository.deleteAll();
        packageRepository.deleteAll();
        userRepository.deleteAll();

        customer = userRepository.save(User.builder()
                .fullName("Customer Test")
                .email("customer@test.com")
                .passwordHash("hash")
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true)
                .build());

        operator = userRepository.save(User.builder()
                .fullName("Operator Test")
                .email("operator@test.com")
                .passwordHash("hash")
                .role(Role.OPERATOR)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true)
                .build());

        rentalPackage = packageRepository.save(RentalPackage.builder()
                .name("Gói 30 ngày")
                .durationDays(30)
                .price(new BigDecimal("1500000"))
                .status(PackageStatus.ACTIVE)
                .build());

        Room room = roomRepository.save(Room.builder()
                .name("Phòng 01")
                .status(RoomStatus.ACTIVE)
                .build());

        tray1 = trayRepository.save(Tray.builder()
                .code("TRAY-101")
                .room(room)
                .status(TrayStatus.AVAILABLE)
                .build());

        tray2 = trayRepository.save(Tray.builder()
                .code("TRAY-102")
                .room(room)
                .status(TrayStatus.AVAILABLE)
                .build());
    }

    @Test
    void testCompleteRentalAndLinkWorkflow() {
        // 1. Customer requests rental
        RentalRequest req = new RentalRequest();
        req.setPackage_id(rentalPackage.getId());
        req.setQuantity(2);
        req.setNotes("Khách muốn trồng nấm bào ngư");

        RentalResponse pendingRental = rentalService.requestRental(customer.getId(), req);
        assertNotNull(pendingRental);
        assertEquals(RentalStatus.PENDING, pendingRental.getStatus());
        Integer rentalId = pendingRental.getId();

        // 2. Operator approves rental
        RentalResponse approvedRental = rentalService.approveRental(rentalId, operator.getId());
        assertEquals(RentalStatus.APPROVED, approvedRental.getStatus());

        // 3. Operator assigns trays and generates link code (24h expiry)
        AssignTraysRequest assignReq = new AssignTraysRequest();
        assignReq.setTray_ids(List.of(tray1.getId(), tray2.getId()));

        Map<String, Object> assignResult = rentalService.assignTrays(rentalId, operator.getId(), assignReq);
        assertNotNull(assignResult);
        String linkCode = (String) assignResult.get("link_code");
        assertNotNull(linkCode);
        assertEquals(8, linkCode.length(), "Link code must be 8 characters");

        // Verify trays are ASSIGNED
        assertEquals(TrayStatus.ASSIGNED, trayRepository.findById(tray1.getId()).get().getStatus());
        assertEquals(TrayStatus.ASSIGNED, trayRepository.findById(tray2.getId()).get().getStatus());

        // 4. Customer links trays using link code
        RentalResponse activeRental = rentalService.linkWithCode(customer.getId(), linkCode);
        assertEquals(RentalStatus.ACTIVE, activeRental.getStatus());
        assertNotNull(activeRental.getStart_date());
        assertNotNull(activeRental.getEnd_date());

        // Verify trays transitioned to RENTED
        assertEquals(TrayStatus.RENTED, trayRepository.findById(tray1.getId()).get().getStatus());
        assertEquals(TrayStatus.RENTED, trayRepository.findById(tray2.getId()).get().getStatus());

        // 5. Trying to use the link code again fails
        assertThrows(AppException.class, () -> rentalService.linkWithCode(customer.getId(), linkCode));
    }
}
