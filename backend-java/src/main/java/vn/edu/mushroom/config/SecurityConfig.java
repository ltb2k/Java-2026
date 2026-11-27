package vn.edu.mushroom.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"message\":\"Forbidden: You do not have permission to perform this action\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(
                    "/",
                    "/health",
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/verify-email",
                    "/v3/api-docs",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/swagger-resources/**",
                    "/api/docs",
                    "/api/docs/**",
                    "/docs",
                    "/docs/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/packages", "/api/packages/*").permitAll()

                // Admin only endpoints
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/packages/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/packages/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/packages/**").hasRole("ADMIN")

                // Operator & Admin endpoints
                .requestMatchers("/api/rooms/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/trays/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.PUT, "/api/trays/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.DELETE, "/api/trays/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/devices/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.PUT, "/api/devices/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.DELETE, "/api/devices/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers("/api/alerts/thresholds/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/rentals/*/approve").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/rentals/*/reject").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/rentals/*/assign-trays").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/harvests").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.PUT, "/api/harvests/*/record").hasAnyRole("ADMIN", "OPERATOR")

                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .toList();

        if (origins.contains("*")) {
            configuration.addAllowedOriginPattern("*");
        } else {
            configuration.setAllowedOrigins(origins);
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
