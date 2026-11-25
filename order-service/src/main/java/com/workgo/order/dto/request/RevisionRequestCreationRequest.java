package com.workgo.order.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RevisionRequestCreationRequest {

    String reason;
    Integer deliveryVersion;
    Integer agreementVersion;
    java.util.List<String> criterionRefs;
    Boolean scopeChange;

}
