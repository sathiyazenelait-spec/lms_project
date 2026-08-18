package com.zenelait.lms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DemoRegisterRequest {
    // Organization Details
    @NotBlank(message = "Organization name is required")
    private String orgName;

    @NotBlank(message = "Organization email is required")
    @Email(message = "Invalid organization email format")
    private String orgEmail;

    private String orgPhone;
    private String orgAddress;
    private String orgCity;
    private String orgCountry;
    private String orgDescription;

    // Super Admin Details
    @NotBlank(message = "Admin name is required")
    private String adminName;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Invalid admin email format")
    private String adminEmail;

    @NotBlank(message = "Admin password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String adminPassword;

    private String adminGender;
    private String adminPhone;
}
