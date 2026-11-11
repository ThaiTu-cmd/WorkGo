package com.workgo.job.dto.response.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.UUID;

/** Read projection of catalog's public category response. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CategoryResponse {
    private UUID categoryId;
    private String name;
    private String slug;
    private String description;
}
