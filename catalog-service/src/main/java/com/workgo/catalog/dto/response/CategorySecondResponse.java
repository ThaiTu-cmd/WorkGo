package com.workgo.catalog.dto.response;


import com.workgo.catalog.entity.Category;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Builder
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CategorySecondResponse {


    UUID categoryId;

    String name;

    String slug;

}
