package com.workgo.payment.reppository.client;

import com.workgo.payment.configuration.FeignInternalConfig;
import com.workgo.payment.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@FeignClient(name = "paymentCommunicationClient", url = "${app.services.communication}", configuration = FeignInternalConfig.class)
public interface CommunicationClient {
    record NotificationRequest(UUID eventId, UUID recipientId, String type, String title,
                               String content, String referenceType, UUID referenceId) {}
    record NotificationAck(UUID id, UUID recipientId, String type, String referenceType, UUID referenceId) {}
    @PostMapping("/internal/notifications")
    ApiResponse<NotificationAck> notify(@RequestBody NotificationRequest request);
}
