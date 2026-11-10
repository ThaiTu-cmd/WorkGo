package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.ExecutionType;
import com.workgo.catalog.enumeration.ServiceStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ServiceUpdateRequest {

    UUID categoryId;

    ExecutionType executionType;

    String title;

    String slug;

    String description;

    String currency;

    ServiceStatus status;

    BigDecimal basePrice;


}
