package com.zenelait.lms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long   userId;
    private String userCode;   // STU-2026-001 etc.
    private String name;
    private String email;
    private String role;       // "STUDENT" | "TEACHER" | "PARENT" | "ADMIN"
    private Long   organizationId;
    private Boolean superAdmin;
    // Email delivery warnings — null/empty = all emails sent OK
    // Populated only on registration; frontend shows popup if non-empty
    private List<String> emailWarnings;
}
