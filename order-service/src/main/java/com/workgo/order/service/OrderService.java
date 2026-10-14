package com.workgo.order.service;


import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.OrderItemResponse;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.dto.response.client.AddOnResponse;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.dto.response.client.ServiceResponse;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderItem;
import com.workgo.order.entity.OrderStatusHistory;
import com.workgo.order.enumeration.*;
import com.workgo.order.enumeration.client.PackageStatus;
import com.workgo.order.enumeration.client.ServiceStatus;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.OrderItemMapper;
import com.workgo.order.mapper.OrderMapper;
import com.workgo.order.mapper.OrderStatusHistoryMapper;
import com.workgo.order.reppository.OrderItemRepository;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.OrderStatusHistoryRepository;
import com.workgo.order.reppository.client.CatalogClient;
import com.workgo.order.utils.TokenUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderService {

    OrderRepository orderRepository;
    OrderMapper orderMapper;
    OrderStatusHistoryMapper orderStatusHistoryMapper;
    CatalogClient catalogClient;
    OrderStatusService orderStatusService;
    OrderStatusHistoryRepository orderStatusHistoryRepository;
    OrderItemRepository orderItemRepository;
    OrderItemMapper orderItemMapper;
    TokenUtils tokenUtils;

    @NonFinal
    @Value("${order.platform-fee-rate}")
    BigDecimal platformFeeRate;

    @Transactional
    public OrderResponse createOrder(OrderCreationRequest request){

        UUID userId = tokenUtils.getCurrentUserId();
        ServiceResponse serviceResponse = catalogClient.getService(request.getServiceId());
        PackageResponse packageResponse = catalogClient.getPackage(request.getPackageId());

        if(!ServiceStatus.PUBLISHED.equals(serviceResponse.getStatus())){
            throw new AppException(ErrorCode.SERVICE_NOT_AVAILABLE);
        }

        if (!request.getServiceId().equals(packageResponse.getServiceId())){
            throw new AppException(ErrorCode.PACKAGE_NOT_FOUND);
        }

        if (!PackageStatus.ACTIVE.equals(packageResponse.getPackageStatus())){
            throw new AppException(ErrorCode.PACKAGE_NOT_AVAILABLE);
        }

        if (serviceResponse.getProviderId().equals(tokenUtils.getCurrentProviderId())){
            throw new AppException(ErrorCode.ORDER_CANNOT_BUY_OWN_SERVICE);
        }

        ExecutionType executionType = serviceResponse.getExecutionType();

        BigDecimal subtotal = packageResponse.getPrice();
        BigDecimal platformFee = subtotal.multiply(platformFeeRate).setScale(2, RoundingMode.HALF_UP);

        Order order = orderRepository.save(Order.builder()
                .orderNumber(generateOrderNumber())
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .sourceType(SourceType.SERVICE)
                .sourceId(serviceResponse.getServiceId())
                .clientId(userId)
                .providerId(serviceResponse.getProviderId())
                .serviceId(serviceResponse.getServiceId())
                .packageId(packageResponse.getPackageId())
                .executionType(executionType)
                .title(serviceResponse.getTitle() + " - " + packageResponse.getName())
                .subtotal(subtotal)
                .platformFee(platformFee)
                .totalAmount(subtotal)
                .providerNetAmount(subtotal.subtract(platformFee))
                .placedAt(Instant.now())
                .build());


        OrderItem packageItem = OrderItem.builder()
                .name(packageResponse.getName())
                .quantity(1)
                .unitPrice(packageResponse.getPrice())
                .amount(packageResponse.getPrice())
                .itemType(ItemType.PACKAGE)
                .referenceId(packageResponse.getPackageId())
                .order(order)
                .build();

        orderItemRepository.save(packageItem);

        order.getOrderItem().add(packageItem);

        List<AddOnResponse> addOnResponseList = catalogClient
                .getAllAddonsByService(request.getServiceId());

        if(!addOnResponseList.isEmpty()){
            BigDecimal addonTotalAmount = BigDecimal.ZERO;
            List<OrderItem> orderItems = new ArrayList<>();

            for(AddOnResponse addOn : addOnResponseList){
                OrderItem orderItem = OrderItem.builder()
                        .name(addOn.getName())
                        .quantity(1)
                        .unitPrice(addOn.getPrice())
                        .amount(addOn.getPrice())
                        .itemType(ItemType.ADDON)
                        .referenceId(addOn.getAddOnId())
                        .order(order)
                        .build();

                orderItems.add(orderItem);
                order.getOrderItem().add(orderItem);
                addonTotalAmount = addonTotalAmount.add(addOn.getPrice());
            }
            order.setTotalAmount(order.getTotalAmount().add(addonTotalAmount));
            orderItemRepository.saveAll(orderItems);
            orderRepository.save(order);
        }



        //luu lich su cap nhat order
        orderStatusService.recordCreated(order, userId);
        return orderMapper.toOrderResponse(order);

    }

    public PageResponse<OrderResponse> getMyOrders(RoleName roleName, int page, int size){

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        UUID userId = null;
        Page<Order> pageData = null;

        switch (roleName){
            case PROVIDER -> {
                userId = tokenUtils.getCurrentProviderId();
                pageData = orderRepository.findAllByProviderId(userId, pageable);
            }
            case CLIENT -> {
                userId = tokenUtils.getCurrentUserId();
                pageData = orderRepository.findAllByClientId(userId, pageable);
            }
            default -> throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return PageResponse.<OrderResponse>builder()
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .currentPage(page)
                .data(pageData.stream()
                        .map(orderMapper::toOrderResponse)
                        .toList())
                .build();
    }

    public OrderResponse getOrder(UUID orderId){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        return orderMapper.toOrderResponse(order);
    }

    public PageResponse<OrderStatusHistoryResponse> getOrderHistory(UUID orderId, int page, int size){

        Sort sort = Sort.by("createdAt").descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<OrderStatusHistory> pageData = orderStatusHistoryRepository.findAllByOrder_OrderId(orderId, pageable);

        return PageResponse.<OrderStatusHistoryResponse>builder()
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .currentPage(page)
                .data(pageData.stream()
                        .map(orderStatusHistoryMapper::toOrderHistoryResponse)
                        .toList())
                .build();

    }

    private String generateOrderNumber(){
        String date = Instant.now().toString();
        String random = UUID.randomUUID().toString();

        return "WG" + date + "-" + random;
     }

}
