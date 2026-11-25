package com.workgo.order.reppository.client;
import com.workgo.order.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@FeignClient(name="orderNotificationClient",url="${app.services.communication}",configuration=InternalFeignConfiguration.class)
public interface OrderNotificationClient {
    record Notice(String eventId,UUID recipientId,String type,String title,String content,String referenceType,UUID referenceId) {}
    record Ack(UUID id,UUID recipientId,String type,String referenceType,UUID referenceId) {}
    @PostMapping("/internal/notifications") ApiResponse<Ack> send(@RequestBody Notice notice);
}
