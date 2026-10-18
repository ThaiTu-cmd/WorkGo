package com.workgo.catalog.controller.internalController;

import com.workgo.catalog.dto.response.AddOnResponse;
import com.workgo.catalog.service.AddOnService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/addons")
public class InternalAddOnController {

    AddOnService addOnService;

    @GetMapping("/services/{serviceId}")
    public List<AddOnResponse> getAllAddonsByService(
            @PathVariable UUID serviceId
            ){

        return addOnService.getAllByService(serviceId);

    }

}
