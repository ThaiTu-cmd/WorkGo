package com.workgo.order.service;

import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.dto.response.PaymentConfirmationResponse;
import com.workgo.order.dto.response.client.AddOnResponse;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.dto.response.client.ProviderProfileResponse;
import com.workgo.order.dto.response.client.ServiceResponse;
import com.workgo.order.dto.snapshot.*;
import com.workgo.order.entity.Order;
import com.workgo.order.entity.OrderItem;
import com.workgo.order.entity.OrderSnapshot;
import com.workgo.order.entity.OrderStatusHistory;
import com.workgo.order.enumeration.*;
import com.workgo.order.enumeration.client.AddOnStatus;
import com.workgo.order.enumeration.client.PackageStatus;
import com.workgo.order.enumeration.client.ServiceStatus;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.OrderItemMapper;
import com.workgo.order.mapper.OrderMapper;
import com.workgo.order.mapper.OrderStatusHistoryMapper;
import com.workgo.order.reppository.OrderItemRepository;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.reppository.OrderSnapshotRepository;
import com.workgo.order.reppository.OrderStatusHistoryRepository;
import com.workgo.order.reppository.client.CatalogClient;
import com.workgo.order.reppository.client.IdentityClient;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderService {

    OrderRepository orderRepository;
    OrderMapper orderMapper;
    OrderStatusHistoryMapper orderStatusHistoryMapper;
    CatalogClient catalogClient;
    IdentityClient identityClient;
    OrderStatusService orderStatusService;
    OrderSnapshotRepository orderSnapshotRepository;
    OrderStatusHistoryRepository orderStatusHistoryRepository;
    OrderItemRepository orderItemRepository;
    OrderItemMapper orderItemMapper;
    ExecutionService executionService;
    TokenUtils tokenUtils;

    @NonFinal
    @Value("${order.platform-fee-rate}")
    BigDecimal platformFeeRate;

    @Transactional
    public OrderResponse createOrder(OrderCreationRequest request){

        UUID clientId = tokenUtils.getCurrentUserId();

        if (!tokenUtils.hasRole("ROLE_CLIENT")) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        ServiceResponse serviceResponse = catalogClient.getService(request.getServiceId());

        if(!ServiceStatus.PUBLISHED.equals(serviceResponse.getStatus())){
            throw new AppException(ErrorCode.SERVICE_NOT_AVAILABLE);
        }

        PackageResponse packageResponse = catalogClient.getPackage(request.getPackageId());

        if (!request.getServiceId().equals(packageResponse.getServiceId())){
            throw new AppException(ErrorCode.PACKAGE_NOT_FOUND);
        }

        if (!PackageStatus.ACTIVE.equals(packageResponse.getPackageStatus())){
            throw new AppException(ErrorCode.PACKAGE_NOT_AVAILABLE);
        }

        List<AddOnResponse> addOns = collectAddons(request.getServiceId(), request.getAddonIds());

        //provider khong duoc mua cua chinh minh
        if (Objects.equals(serviceResponse.getProviderId(), tokenUtils.getCurrentProviderIdOrNull())){
            throw new AppException(ErrorCode.ORDER_CANNOT_BUY_OWN_SERVICE);
        }

        //tinh subtotal
        BigDecimal subtotal = packageResponse.getPrice();

        for (AddOnResponse addOn : addOns){
            subtotal = subtotal.add(addOn.getPrice());
        }

        BigDecimal platformFee = subtotal.multiply(platformFeeRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal;                          // client tra dung gia niem yet
        BigDecimal providerNetAmount = subtotal.subtract(platformFee);

        //luu order -> lay id
        Order order = orderRepository.save(Order.builder()
                .orderNumber(generateOrderNumber())
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .sourceType(SourceType.SERVICE)
                .sourceId(serviceResponse.getServiceId())
                .clientId(clientId)
                .providerId(serviceResponse.getProviderId())
                .serviceId(serviceResponse.getServiceId())
                .packageId(packageResponse.getPackageId())
                .executionType(serviceResponse.getExecutionType())
                .title(serviceResponse.getTitle() + " - " + packageResponse.getName())
                .subtotal(subtotal)
                .platformFee(platformFee)
                .totalAmount(totalAmount)
                .providerNetAmount(providerNetAmount)
                .currency(packageResponse.getCurrency() == null ? "VND" : packageResponse.getCurrency())
                .placedAt(Instant.now())
                .build());

        //luu OrderItem
        List<OrderItem> orderItems = buildOrderItems(order, packageResponse, addOns, platformFee);

        orderItemRepository.saveAll(orderItems);

        //tao digital/ onsite execution tuy loai executiontype cua order
        executionService.createFor(order, request, packageResponse);

        saveSnapshot(order, request, serviceResponse, packageResponse, addOns,
                subtotal, platformFee, totalAmount, providerNetAmount);


        //ghi lai order status history
        orderStatusService.recordCreated(order, clientId);

        return orderMapper.toOrderResponse(order);
    }

    public PaymentConfirmationResponse<Object> confirmPayment(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        order.setPaymentStatus(PaymentStatus.SUCCEEDED);

        orderStatusService.transition(order, OrderStatus.CONFIRMED, null, RoleName.SYSTEM);

        return PaymentConfirmationResponse.builder()
                .orderId(order.getOrderId())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .build();
    }

    //loc ra addon duoc chon
    private List<AddOnResponse> collectAddons(UUID serviceId, List<UUID> addonIds) {

        if (addonIds == null || addonIds.isEmpty()) {
            return List.of();
        }

        Map<UUID, AddOnResponse> addOnsOfService = catalogClient.getAllAddonsByService(serviceId)
                .stream()
                .collect(Collectors.toMap(
                        AddOnResponse::getAddOnId,
                        addOn -> addOn,
                        (first, second) -> first));

        List<AddOnResponse> selected = new ArrayList<>();

        for (UUID addOnId : new LinkedHashSet<>(addonIds)) {

            AddOnResponse addOn = addOnsOfService.get(addOnId);

            if (addOn == null) {
                throw new AppException(ErrorCode.ORDER_ADDON_NOT_FOUND);
            }

            if (!AddOnStatus.ACTIVE.equals(addOn.getStatus())) {
                throw new AppException(ErrorCode.ORDER_ADDON_NOT_AVAILABLE);
            }

            selected.add(addOn);
        }

        return selected;
    }

    private List<OrderItem> buildOrderItems(Order order,
                                            PackageResponse packageResponse,
                                            List<AddOnResponse> addOns,
                                            BigDecimal platformFee) {

        List<OrderItem> items = new ArrayList<>();
        int sortOrder = 0;

        //luu package
        items.add(OrderItem.builder()
                .name(packageResponse.getName())
                .quantity(1)
                .unitPrice(packageResponse.getPrice())
                .amount(packageResponse.getPrice())
                .itemType(ItemType.PACKAGE)
                .referenceId(packageResponse.getPackageId())
                .sortOrder(sortOrder++)
                .order(order)
                .build());

        //luu cac add-on
        for (AddOnResponse addOn : addOns) {
            items.add(OrderItem.builder()
                    .name(addOn.getName())
                    .quantity(1)
                    .unitPrice(addOn.getPrice())
                    .amount(addOn.getPrice())
                    .itemType(ItemType.ADDON)
                    .referenceId(addOn.getAddOnId())
                    .sortOrder(sortOrder++)
                    .order(order)
                    .build());
        }

      //platform-fee
        items.add(OrderItem.builder()
                .name("Phi nen tang")
                .quantity(1)
                .unitPrice(platformFee)
                .amount(platformFee)
                .itemType(ItemType.PLATFORM_FEE)
                .sortOrder(sortOrder)
                .order(order)
                .build());

        return items;
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

    private void saveSnapshot(Order order,
                              OrderCreationRequest request,
                              ServiceResponse serviceResponse,
                              PackageResponse packageResponse,
                              List<AddOnResponse> addOns,
                              BigDecimal subtotal,
                              BigDecimal platformFee,
                              BigDecimal totalAmount,
                              BigDecimal providerNetAmount) {

        ProviderProfileResponse provider =
                identityClient.getProviderProfile(serviceResponse.getProviderId());

        List<AddOnSnapshot> addOnSnapshots = addOns.stream()
                .map(addOn -> AddOnSnapshot.builder()
                        .addOnId(addOn.getAddOnId())
                        .name(addOn.getName())
                        .description(addOn.getDescription())
                        .price(addOn.getPrice())
                        .build())
                .toList();

        orderSnapshotRepository.save(OrderSnapshot.builder()
                .order(order)
                .serviceSnapshot(ServiceSnapshot.builder()
                        .serviceId(serviceResponse.getServiceId())
                        .providerId(serviceResponse.getProviderId())
                        .title(serviceResponse.getTitle())
                        .description(serviceResponse.getDescription())
                        .executionType(serviceResponse.getExecutionType())
                        .basePrice(BigDecimal.valueOf(serviceResponse.getBasePrice()))
                        .currency(serviceResponse.getCurrency())
                        .build())
                .packageSnapshot(PackageSnapshot.builder()
                        .packageId(packageResponse.getPackageId())
                        .name(packageResponse.getName())
                        .description(packageResponse.getDescription())
                        .price(packageResponse.getPrice())
                        .currency(packageResponse.getCurrency())
                        .deliveryDay(packageResponse.getDeliveryDay())
                        .durationMinute(packageResponse.getDurationMinute())
                        .revisionLimit(packageResponse.getRevisionLimit())
                        .build())
                .addOnSnapshot(addOnSnapshots)
                .pricingSnapshot(PricingSnapshot.builder()
                        .subtotal(subtotal)
                        .platformFee(platformFee)
                        .totalAmount(totalAmount)
                        .providerNetAmount(providerNetAmount)
                        .platformFeeRate(platformFeeRate)
                        .currency(order.getCurrency())
                        .build())
                .providerSnapshot(ProviderSnapshot.builder()
                        .providerId(serviceResponse.getProviderId())
                        .businessName(provider.getBusinessName())
                        .build())
                .executionSnapshot(ExecutionSnapshot.builder()
                        .executionType(serviceResponse.getExecutionType())
                        .address(serviceResponse.getExecutionType() == ExecutionType.ONSITE
                                ? request.getAddress() : null)
                        .autoCompleteHours(serviceResponse.getExecutionType() == ExecutionType.ONSITE
                                ? 24 : 72)
                        .build())
                .requirementValues(null)
                .build());
    }

}