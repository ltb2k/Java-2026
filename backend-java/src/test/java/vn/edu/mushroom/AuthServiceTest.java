package vn.edu.mushroom;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.LoginRequest;
import vn.edu.mushroom.dto.request.RegisterRequest;
import vn.edu.mushroom.dto.response.AuthResponse;
import vn.edu.mushroom.dto.response.UserResponse;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.UserRepository;
import vn.edu.mushroom.service.AuthService;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest req = new RegisterRequest();
        req.setFull_name("Nguyen Van A");
        req.setEmail("nguyenvana@gmail.com");
        req.setPassword("Password123!");
        req.setRole(Role.CUSTOMER);

        UserResponse user = authService.register(req);
        assertNotNull(user);
        assertNotNull(user.getId());
        assertEquals("Nguyen Van A", user.getFull_name());
        assertEquals("nguyenvana@gmail.com", user.getEmail());
        assertEquals(Role.CUSTOMER, user.getRole());
    }

    @Test
    void testRegisterDuplicateEmailThrows() {
        RegisterRequest req = new RegisterRequest();
        req.setFull_name("User 1");
        req.setEmail("duplicate@gmail.com");
        req.setPassword("Password123!");

        authService.register(req);

        RegisterRequest req2 = new RegisterRequest();
        req2.setFull_name("User 2");
        req2.setEmail("duplicate@gmail.com");
        req2.setPassword("Password123!");

        assertThrows(AppException.class, () -> authService.register(req2));
    }

    @Test
    void testLoginSuccess() {
        RegisterRequest regReq = new RegisterRequest();
        regReq.setFull_name("Login User");
        regReq.setEmail("login@gmail.com");
        regReq.setPassword("Password123!");
        authService.register(regReq);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("login@gmail.com");
        loginReq.setPassword("Password123!");

        AuthResponse auth = authService.login(loginReq);
        assertNotNull(auth);
        assertNotNull(auth.getToken());
        assertNotNull(auth.getRefreshToken());
        assertEquals("Login User", auth.getUser().getName());
    }

    @Test
    void testLoginWrongPasswordIncrementsAttemptsAndLocks() {
        RegisterRequest regReq = new RegisterRequest();
        regReq.setFull_name("Lock User");
        regReq.setEmail("lock@gmail.com");
        regReq.setPassword("Password123!");
        authService.register(regReq);

        LoginRequest wrongReq = new LoginRequest();
        wrongReq.setEmail("lock@gmail.com");
        wrongReq.setPassword("WrongPass!");

        // 4 failed attempts throw unauthorized
        for (int i = 0; i < 4; i++) {
            assertThrows(AppException.class, () -> authService.login(wrongReq));
        }

        // 5th failed attempt locks the account
        AppException ex = assertThrows(AppException.class, () -> authService.login(wrongReq));
        assertTrue(ex.getMessage().contains("khóa"));
    }
}
