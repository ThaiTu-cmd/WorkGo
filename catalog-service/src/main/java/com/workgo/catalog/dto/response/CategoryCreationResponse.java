package com.workgo.catalog.dto.response;


import com.workgo.catalog.entity.Category;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CategoryCreationResponse {


    UUID categoryId;

    String name;

    String slug;

    String description;

    Instant createdAt;

    UUID createdBy;

    Instant updatedAt;

    UUID updatedBy;

    UUID parent;

    Set<CategorySecondResponse> children;

}
