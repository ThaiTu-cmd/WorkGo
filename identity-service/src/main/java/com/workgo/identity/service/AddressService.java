package com.workgo.identity.service;

import com.workgo.identity.Exception.AppException;
import com.workgo.identity.Exception.ErrorCode;
import com.workgo.identity.Mapper.AddressMapper;
import com.workgo.identity.dto.PageResponse;
import com.workgo.identity.dto.request.AddressCreationRequest;
import com.workgo.identity.dto.request.AddressUpdateRequest;
import com.workgo.identity.dto.response.AddressResponse;
import com.workgo.identity.entity.Address;
import com.workgo.identity.entity.User;
import com.workgo.identity.repository.AddressRepository;
import com.workgo.identity.repository.UserRepository;
import com.workgo.identity.util.Util;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.UUID;


@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class AddressService {

    AddressMapper addressMapper;
    AddressRepository addressRepository;
    UserRepository userRepository;
    Util util;

    public AddressResponse createAddress(AddressCreationRequest request){
        User user = util.getCurrentUser();

        Address address = Address.builder()
                .label(request.getLabel())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .line1(request.getLine1())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .countryCode(request.getCountryCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .note(request.getNote())
                .isDefault(false)
                .user(user)
                .build();

        addressRepository.save(address);

        return addressMapper.toAddressResponse(address);
    }

    public AddressResponse getAddress(UUID addressId){
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        return addressMapper.toAddressResponse(address);
    }

    public PageResponse<AddressResponse> getMyAddresses(int page, int size){

        Sort sort = Sort.by("createdAt").descending();

        User user = util.getCurrentUser();

        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = addressRepository.findAllByUser_UserId(user.getUserId(), pageable);

        log.info("Du lieu cua pageData : " + pageData.toString());

        return PageResponse.<AddressResponse>builder()
                .currentPage(page)
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .pageSize(pageData.getSize())
                .data(pageData.stream()
                        .map(addressMapper::toAddressResponse)
                        .toList())
                .build();
    }

    public AddressResponse updateAddress(UUID addressId, AddressUpdateRequest request){

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        addressMapper.updateAddress(address, request);

        return addressMapper.toAddressResponse(addressRepository.save(address));
    }

    public void deleteAddress(UUID addressId){

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_EXISTED));

        log.info(address.toString());

        int mark = util.createDeletedMark();

        log.info("Du lieu cua mark : " + mark);

        address.setIsDeleted(mark);

        addressRepository.save(address);
    }

}
