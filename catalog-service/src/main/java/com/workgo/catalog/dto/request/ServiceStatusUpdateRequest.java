package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.ServiceStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceStatusUpdateRequest {

    ServiceStatus status;

}
