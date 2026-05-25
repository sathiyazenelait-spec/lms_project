package com.zenelait.lms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload for creating or updating an Organization.
 * Only the Ultra Super Admin can call these endpoints.
 *
 * POST /api/ultra-super-admin/organizations
 * PUT  /api/ultra-super-admin/organizations/{id}
 */
@Data
public class OrganizationRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    private String phone;
    private String address;
    private String city;
    private String country;
    private String description;
}
