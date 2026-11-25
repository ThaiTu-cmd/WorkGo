package com.workgo.order.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequirementSubmissionRequest {


    Integer checklistVersion;
    Long expectedVersion;
    Map<String, Object> values;

}
