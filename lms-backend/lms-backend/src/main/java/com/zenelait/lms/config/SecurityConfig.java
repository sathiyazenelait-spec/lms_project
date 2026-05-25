package com.zenelait.lms.config;

import com.zenelait.lms.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter      jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Public endpoints ───────────────────────────────────────────
                .requestMatchers(
                    "/api/auth/**",        // all role-specific register / login / refresh
                    "/api/public/**",
                    "/api/departments",     // public department list — no token needed
                    "/api/departments/",
                    "/actuator/health"
                ).permitAll()
                
                // ── Ultra Super Admin ──────────────────────────────────────────
                // All /api/ultra-super-admin/** routes require ULTRA_SUPER_ADMIN role.
                .requestMatchers("/api/ultra-super-admin/**")
                    .hasRole("ULTRA_SUPER_ADMIN")

                // ── Payment Gateway ────────────────────────────────────────────
                .requestMatchers("/api/payment/**").hasAnyRole("PARENT", "STUDENT", "ADMIN")

                // ── Role-protected endpoints ───────────────────────────────────
                // 👀 GET → ALL ROLES (view only)
                .requestMatchers(HttpMethod.GET, "/api/admin/timetable/**")
                    .hasAnyRole("ADMIN", "STUDENT", "TEACHER", "PARENT")
                .requestMatchers(HttpMethod.GET,"/api/student/performance").hasRole("STUDENT")
                // ✏️ WRITE → ADMIN ONLY
                    
                .requestMatchers(HttpMethod.POST, "/api/admin/timetable/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/admin/timetable/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/admin/timetable/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/teacher/**").hasRole("TEACHER")
                .requestMatchers("/api/student/**").hasRole("STUDENT")
                .requestMatchers("/api/parent/**").hasRole("PARENT")

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
