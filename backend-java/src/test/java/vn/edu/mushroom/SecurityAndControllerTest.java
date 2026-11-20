package vn.edu.mushroom;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.config.JwtService;
import vn.edu.mushroom.dto.request.LoginRequest;
import vn.edu.mushroom.dto.request.RegisterRequest;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;
import vn.edu.mushroom.repository.UserRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityAndControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminUser;
    private User customerUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .fullName("Admin")
                .email("admin@farm.local")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true)
                .build());

        customerUser = userRepository.save(User.builder()
                .fullName("Customer")
                .email("customer@farm.local")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .role(Role.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true)
                .build());
    }

    @Test
    void testPublicEndpointsAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("running"));

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));

        mockMvc.perform(get("/api/packages"))
                .andExpect(status().isOk());
    }

    @Test
    void testSwaggerAndOpenApiEndpointsAccessibleWithoutToken() throws Exception {
        // /swagger-ui/index.html returns 200 and serves HTML
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML));

        // /v3/api-docs returns 200 and OpenAPI JSON
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.openapi").exists())
                .andExpect(jsonPath("$.info.title").value("Mushroom IoT API (Spring Boot)"));

        // /v3/api-docs/swagger-config returns 200 and Swagger config JSON
        mockMvc.perform(get("/v3/api-docs/swagger-config"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.configUrl").exists());

        // /swagger-ui.html redirects to /swagger-ui/index.html
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());

        // /api/docs redirects to /swagger-ui/index.html
        mockMvc.perform(get("/api/docs"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "/swagger-ui/index.html"));
    }

    @Test
    void testProtectedEndpointWithoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/trays"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testCustomerTokenOnAdminEndpointReturns403() throws Exception {
        String customerToken = jwtService.generateAccessToken(customerUser);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminTokenOnAdminEndpointReturns200() throws Exception {
        String adminToken = jwtService.generateAccessToken(adminUser);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray());
    }

    @Test
    void testAdminInheritsOperatorForRooms() throws Exception {
        String adminToken = jwtService.generateAccessToken(adminUser);

        mockMvc.perform(get("/api/rooms")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
