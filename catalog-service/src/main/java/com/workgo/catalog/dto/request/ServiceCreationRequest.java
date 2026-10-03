package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.ExecutionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceCreationRequest {


    UUID categoryId;

    ExecutionType executionType;

    String title;

    String slug;

    String description;

    double basePrice;

    String currency;


}
