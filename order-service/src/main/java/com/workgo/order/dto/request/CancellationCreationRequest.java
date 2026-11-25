package com.workgo.order.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CancellationCreationRequest {

    String reasonCode;

    String note;

    java.util.UUID caseId;

    public CancellationCreationRequest(String reasonCode, String note) {
        this.reasonCode = reasonCode;
        this.note = note;
    }

}
