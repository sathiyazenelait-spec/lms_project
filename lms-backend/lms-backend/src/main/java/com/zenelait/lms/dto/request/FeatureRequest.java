package com.zenelait.lms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FeatureRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String featureKey;

    private String description;
}
