package vn.edu.mushroom.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;
import vn.edu.mushroom.repository.UserRepository;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class DemoAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccountInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        ensureUser("Quản trị viên", "admin@mushroom.local", "Admin@123456", Role.ADMIN);
        ensureUser("Nhân viên vận hành", "operator@mushroom.local", "Operator@123456", Role.OPERATOR);
        ensureUser("Khách thuê mẫu", "customer@mushroom.local", "Customer@123456", Role.CUSTOMER);
    }

    private void ensureUser(String fullName, String email, String rawPassword, Role role) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true)
                .failedLoginAttempts(0)
                .build();
        userRepository.save(user);
        log.info("[Seed] Created missing demo account: {} ({})", email, role);
    }
}
