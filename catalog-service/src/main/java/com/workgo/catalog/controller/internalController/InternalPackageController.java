package com.workgo.catalog.controller.internalController;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.PackageCreationRequest;
import com.workgo.catalog.dto.request.PackageUpdateRequest;
import com.workgo.catalog.dto.response.PackageResponse;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.PackageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/internal/packages")
public class InternalPackageController {

    PackageService packageService;

    //lay mot package cu the
    @GetMapping("/{packageId}")
   PackageResponse getPackage(
            @PathVariable UUID packageId
    ) {
        return packageService.getPackage(packageId);
    }

}