package com.workgo.order.reppository.client;

import com.workgo.order.dto.ApiResponse;
import com.workgo.order.dto.request.SlotActionRequest;
import com.workgo.order.dto.response.client.AddOnResponse;
import com.workgo.order.dto.response.client.BookingSlotResponse;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.dto.response.client.ProviderProfileResponse;
import com.workgo.order.dto.response.client.ServiceResponse;
import org.apache.kafka.shaded.com.google.protobuf.Api;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "catalog-service", url = "${app.services.catalog}")
public interface CatalogClient {

    @GetMapping("/internal/services/{serviceId}")
    ServiceResponse getService(@PathVariable UUID serviceId);

    @GetMapping("/internal/packages/{packageId}")
    PackageResponse getPackage(@PathVariable UUID packageId);

    @GetMapping("/internal/addons/services/{serviceId}")
    List<AddOnResponse> getAllAddonsByService(@PathVariable UUID serviceId);

    @PostMapping("/internal/slots/{slotId}/hold")
    BookingSlotResponse holdSlot(@PathVariable UUID slotId, @RequestBody SlotActionRequest request);

    @PostMapping("/internal/slots/{slotId}/confirm")
    BookingSlotResponse confirmSlot(@PathVariable UUID slotId, @RequestBody SlotActionRequest request);

    @PostMapping("/internal/slots/{slotId}/release")
    BookingSlotResponse releaseSlot(@PathVariable UUID slotId, @RequestBody SlotActionRequest request);

}
