package com.workgo.identity.controller;

import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.dto.ApiResponse;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.AddressCreationRequest;
import com.workgo.identity.dto.request.AddressUpdateRequest;
import com.workgo.identity.dto.response.AddressResponse;
import com.workgo.identity.service.AddressService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.apache.kafka.shaded.com.google.protobuf.Api;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/addresses")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AddressController {

    AddressService addressService;

    @PostMapping
    ApiResponse<AddressResponse> createAddress(
            @RequestBody AddressCreationRequest request
            ){
        return ApiResponse.<AddressResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addressService.createAddress(request))
                .build();
    }

    @GetMapping("/{addressId}")
    ApiResponse<AddressResponse> getAddress(
            @PathVariable UUID addressId
            ){
        return ApiResponse.<AddressResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addressService.getAddress(addressId))
                .build();
    }

    @GetMapping("/my")
    PageResponse<AddressResponse> getMyAddresses(
        @RequestParam(value = "page", required = false, defaultValue = "0") int page,
        @RequestParam(value = "page", required = false, defaultValue =  "10") int size
    ){
        return addressService.getMyAddresses(page, size);
    }

    @PutMapping("/{addressId}")
    ApiResponse<AddressResponse> updateAddress(
            @PathVariable UUID addressId,
            @RequestBody AddressUpdateRequest request
    ){
        return ApiResponse.<AddressResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(addressService.updateAddress(addressId, request))
                .build();
    }

    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> deleteAddress(
            @PathVariable UUID addressId
    ){

        addressService.deleteAddress(addressId);

        return ApiResponse.<Void>builder()
                .build();
    }

}
