package com.workgo.payment.dto.response.client;
import lombok.*;
import java.util.UUID;
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TrustDisputeStatusResponse {
    private UUID orderId;
    private Boolean hasActiveDispute;
    private UUID activeDisputeId;
    private String status;
}
