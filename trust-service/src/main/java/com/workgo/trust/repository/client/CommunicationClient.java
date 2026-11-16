package com.workgo.trust.repository.client;

import com.workgo.trust.dto.request.client.InternalNotificationCreateReq;
import com.workgo.trust.dto.response.ApiResponse;
import com.workgo.trust.dto.response.client.NotificationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name="trustCommunicationClient", url="${app.services.communication}", configuration=TrustClientsConfiguration.class)
public interface CommunicationClient {
    @PostMapping("/internal/notifications")
    ApiResponse<NotificationResponse> createNotification(@RequestBody InternalNotificationCreateReq request);
}
