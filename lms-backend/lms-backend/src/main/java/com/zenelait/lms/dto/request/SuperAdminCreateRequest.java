package com.zenelait.lms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SuperAdminCreateRequest {
	@NotBlank private String name;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 8) private String password;
    private String academyName;
    private String gender;
    private String phone;

    @NotNull
    private Long organizationId;
}
