package com.workgo.order.service;

import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.request.PaymentConfirmedRequest;
import com.workgo.order.dto.request.SlotActionRequest;
import com.workgo.order.dto.response.InternalOrderTrustSnapshot;
import com.workgo.order.dto.response.OrderDetailResponse;
import com.workgo.order.dto.response.OrderItemResponse;
import com.workgo.order.dto.response.OrderPaymentInfoResponse;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.OrderSnapshotResponse;
import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.dto.response.PaymentConfirmationResponse;
import com.workgo.order.dto.response.client.AddOnResponse;
import com.workgo.order.dto.response.client.FeePolicyResponse;
import com.workgo.order.dto.response.client.PackageResponse;
import com.workgo.order.dto.response.client.ProviderProfileResponse;
import com.workgo.order.dto.response.client.ServiceResponse;
import com.workgo.order.dto.snapshot.*;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.enumeration.client.AddOnStatus;
import com.workgo.order.enumeration.client.PackageStatus;
import com.workgo.order.enumeration.client.ServiceStatus;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.OrderItemMapper;
import com.workgo.order.mapper.OrderMapper;
import com.workgo.order.mapper.OrderSnapshotMapper;
import com.workgo.order.mapper.OrderStatusHistoryMapper;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.CatalogClient;
import com.workgo.order.reppository.client.IdentityClient;
import com.workgo.order.utils.TokenUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
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
    OrderSnapshotMapper orderSnapshotMapper;
    ExecutionService executionService;
    ExecutionRepository executionRepository;
    OnsiteExecutionRepository onsiteExecutionRepository;
    PasswordEncoder passwordEncoder;
    TextEncryptor checkinCodeEncryptor;
    CancellationService cancellationService;
    OrderFeeService orderFeeService;
    ProviderFinancialEligibility providerFinancialEligibility;
    TokenUtils tokenUtils;
    JdbcTemplate jdbcTemplate;
    ObjectMapper objectMapper;
    OrderInputService orderInputService;
    java.time.Clock clock;
    OrderRewardQuoteService rewardQuotes;

    @NonFinal
    @Value("${order.payment-timeout-minutes}")
    long paymentTimeoutMinutes;

    @NonFinal
    @Value("${order.cash.max-amount:2000000}")
    BigDecimal cashMaxAmount;

    @NonFinal
    @Value("${order.cash.max-open-per-provider:1}")
    long cashMaxOpenPerProvider;

    @Transactional(readOnly=true)
    public OrderRewardQuoteService.Quote previewReward(OrderCreationRequest request){
        if(!tokenUtils.hasRole("ROLE_CLIENT"))throw new AppException(ErrorCode.FORBIDDEN);
        if(request==null||request.getServiceId()==null||request.getPackageId()==null)throw new AppException(ErrorCode.INVALID_REQUEST_BODY);
        var listing=catalogClient.getService(request.getServiceId());var pkg=catalogClient.getPackage(request.getPackageId());
        if(listing==null||listing.getStatus()!=ServiceStatus.PUBLISHED||pkg==null||!request.getServiceId().equals(pkg.getServiceId())||pkg.getPackageStatus()!=PackageStatus.ACTIVE)throw new AppException(ErrorCode.SERVICE_NOT_AVAILABLE);
        BigDecimal price=pkg.getPrice();for(var addOn:collectAddons(request.getServiceId(),request.getAddonIds()))price=price.add(addOn.getPrice());
        var policy=orderFeeService.currentPolicy();
        return rewardQuotes.preview(new OrderRewardQuoteService.Input(tokenUtils.getCurrentUserId(),listing.getProviderId(),"SERVICE",listing.getServiceId(),
                listing.getTitle()+(pkg.getName()==null||pkg.getName().isBlank()?"":"\n"+pkg.getName()),price,Objects.requireNonNullElse(pkg.getCurrency(),"VND"),OrderRewardQuoteService.durationDays(listing.getExecutionType(),pkg.getDeliveryDay(),pkg.getDurationMinute()),policy.getFeePolicyVersionId()));
    }

    @Transactional
    public OrderResponse createOrder(OrderCreationRequest request){
        return createOrder(request, null);
    }

    @Transactional
    public OrderResponse createOrder(OrderCreationRequest request, String idempotencyKey){

        UUID clientId = tokenUtils.getCurrentUserId();

        if (!tokenUtils.hasRole("ROLE_CLIENT")) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (request == null) throw new AppException(ErrorCode.INVALID_REQUEST_BODY);
        if (request.getServiceId() == null) throw new AppException(ErrorCode.SERVICE_ID_REQUIRED);
        if (request.getPackageId() == null) throw new AppException(ErrorCode.PACKAGE_ID_REQUIRED);

        String requestHash = null;
        if (idempotencyKey != null) {
            if (idempotencyKey.isEmpty() || idempotencyKey.length() > 128
                    || idempotencyKey.chars().anyMatch(c -> c < 33 || c > 126)) {
                throw new AppException(ErrorCode.ORDER_CREATION_KEY_INVALID);
            }
            requestHash = creationRequestHash(request);
            lockCreation("order-create:" + clientId + ":" + idempotencyKey);
            Optional<Order> previous = orderRepository.findCreationIncludingDeleted(clientId, idempotencyKey);
            if (previous.isPresent()) {
                Order existing = previous.get();
                if (existing.getIsDeleted() != 0 || !requestHash.equals(existing.getCreationRequestHash())) {
                    throw new AppException(ErrorCode.ORDER_CREATION_KEY_CONFLICT);
                }
                return orderMapper.toOrderResponse(existing);
            }
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

        OrderPaymentMethod paymentMethod = resolvePaymentMethod(serviceResponse.getExecutionType(), request.getPaymentMethod());

        //provider khong duoc mua cua chinh minh
        if (Objects.equals(serviceResponse.getProviderId(), tokenUtils.getCurrentProviderIdOrNull())){
            throw new AppException(ErrorCode.ORDER_CANNOT_BUY_OWN_SERVICE);
        }

        providerFinancialEligibility.assertMayStartNewWork(serviceResponse.getProviderId());

        //tinh subtotal
        BigDecimal subtotal = packageResponse.getPrice();

        for (AddOnResponse addOn : addOns){
            subtotal = subtotal.add(addOn.getPrice());
        }

        FeePolicyResponse feePolicy = orderFeeService.currentPolicy();
        BigDecimal platformFee = orderFeeService.successFee(subtotal, feePolicy.getSuccessFeeRate());
        BigDecimal totalAmount = subtotal;                          // client tra dung gia niem yet

        if (paymentMethod == OrderPaymentMethod.CASH) {
            assertCashAllowed(serviceResponse.getProviderId(), totalAmount);
        }
        BigDecimal providerNetAmount = subtotal.subtract(platformFee);
        var quoteInput = new OrderRewardQuoteService.Input(clientId, serviceResponse.getProviderId(),
                "SERVICE", serviceResponse.getServiceId(), serviceResponse.getTitle()+(packageResponse.getName()==null||packageResponse.getName().isBlank()?"":"\n"+packageResponse.getName()),
                subtotal, Objects.requireNonNullElse(packageResponse.getCurrency(), "VND"), OrderRewardQuoteService.durationDays(serviceResponse.getExecutionType(),packageResponse.getDeliveryDay(),packageResponse.getDurationMinute()), feePolicy.getFeePolicyVersionId());
        String rewardQuoteRef=request.getRewardQuoteRef()==null?rewardQuotes.quote(quoteInput):rewardQuotes.reference(quoteInput,request.getRewardQuoteRef());

        //luu order -> lay id
        Order order = orderRepository.save(Order.builder()
                .recoveryGrantId(providerFinancialEligibility.recoveryGrant(serviceResponse.getProviderId()))
                .orderNumber(generateOrderNumber())
                .orderStatus(OrderStatus.PENDING_PAYMENT)
                .paymentStatus(paymentMethod == OrderPaymentMethod.CASH
                        ? PaymentStatus.CASH_ON_SITE : PaymentStatus.PENDING)
                .paymentMethod(paymentMethod)
                .sourceType(SourceType.SERVICE)
                .sourceId(serviceResponse.getServiceId())
                .clientId(clientId)
                .idempotencyKey(idempotencyKey)
                .creationRequestHash(requestHash)
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
                .placedAt(clock.instant())
                .build());

        //luu OrderItem
        List<OrderItem> orderItems = buildOrderItems(order, packageResponse, addOns, platformFee);

        assertItemsTotalMatchesSubtotal(orderItems, subtotal);

        orderItemRepository.saveAll(orderItems);

        //tao digital/ onsite execution tuy loai executiontype cua order
        executionService.createFor(order, request, packageResponse);

        saveSnapshot(order, request, serviceResponse, packageResponse, addOns,
                subtotal, platformFee, totalAmount, providerNetAmount, feePolicy, rewardQuoteRef);


        //ghi lai order status history
        orderStatusService.recordCreated(order, clientId);

        //tien mat tra tai cho, khong qua payment -> chot slot va xac nhan luon
        if (paymentMethod == OrderPaymentMethod.CASH) {

            if (bookOnsiteSlot(order) == null) {
                throw new AppException(ErrorCode.ORDER_SLOT_NOT_AVAILABLE);
            }

            orderStatusService.transition(order, OrderStatus.CONFIRMED, null, RoleName.SYSTEM);
        }

        return orderMapper.toOrderResponse(order);
    }

    private String creationRequestHash(OrderCreationRequest request) {
        List<UUID> addons = request.getAddonIds() == null ? List.of()
                : request.getAddonIds().stream().distinct().sorted(Comparator.nullsFirst(Comparator.naturalOrder())).toList();
        try {
            Object[] canonical=new Object[]{request.getServiceId(), request.getPackageId(),
                    addons, request.getBookingSlotId(), request.getAddress(),
                    request.getPaymentMethod() == null ? OrderPaymentMethod.WALLET : request.getPaymentMethod()};
            if(request.getRewardQuoteRef()!=null){canonical=java.util.Arrays.copyOf(canonical,canonical.length+1);canonical[canonical.length-1]=request.getRewardQuoteRef();}
            byte[] payload = objectMapper.writeValueAsBytes(canonical);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload));
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            throw new IllegalStateException("Cannot fingerprint order creation", e);
        }
    }

    private void lockCreation(String scope) {
        // Transaction-scoped PostgreSQL locks serialize retries and cash limits across service instances.
        jdbcTemplate.query("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", rs -> { }, scope);
    }

    @Transactional
    public PaymentConfirmationResponse<Object> confirmPayment(UUID orderId, PaymentConfirmedRequest request) {

        if (request.getPaymentId() == null) {
            throw new AppException(ErrorCode.ORDER_PAYMENT_ID_REQUIRED);
        }

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        //da confirm roi (SUCCEEDED / RELEASED) hoac don da huy -> tra trang thai hien tai, payment tu xu ly
        if (order.getPaymentStatus() != PaymentStatus.PENDING
                || order.getOrderStatus() == OrderStatus.CANCELLED) {
            return toConfirmationResponse(order, null);
        }

        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS_TRANSITION);
        }

        if (!clock.instant().isBefore(payableUntil(order))) {
            cancellationService.cancelBySystem(order);
            return toConfirmationResponse(order,null);
        }
        Object executionStatus = null;

        //chi on site
        if (order.getExecutionType() == ExecutionType.ONSITE) {

            OnsiteExecution onsite = bookOnsiteSlot(order);

            //slot het han giu -> huy don, payment refund
            if (onsite == null) {
                log.warn("Slot of order {} expired, cancel order, payment {} will refund", orderId, request.getPaymentId());
                cancellationService.cancelBySystem(order);
                return toConfirmationResponse(order, OnsiteExecutionStatus.CANCELLED);
            }

            executionStatus = onsite.getStatus();
        }

        order.setPaymentStatus(PaymentStatus.SUCCEEDED);
        order.setPaymentId(request.getPaymentId());

        orderStatusService.transition(order, OrderStatus.CONFIRMED, null, RoleName.SYSTEM);
        orderInputService.tryStart(orderId);
        log.info("Order {} confirmed by payment {}", orderId, request.getPaymentId());

        return toConfirmationResponse(order, executionStatus);
    }

    @Transactional(readOnly = true)
    public OrderPaymentInfoResponse getPaymentInfo(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Instant payableUntil = payableUntil(order);
        OnsiteExecution onsite = order.getExecutionType() == ExecutionType.ONSITE
                ? executionRepository.findByOrder_OrderId(orderId)
                        .flatMap(e -> onsiteExecutionRepository.findByExecution_ExecutionId(e.getExecutionId()))
                        .orElse(null)
                : null;

        return OrderPaymentInfoResponse.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .clientId(order.getClientId())
                .providerId(order.getProviderId())
                .orderStatus(order.getOrderStatus())
                .executionType(order.getExecutionType())
                .title(order.getTitle())
                .totalAmount(order.getTotalAmount())
                .platformFee(order.getPlatformFee())
                .providerNetAmount(order.getProviderNetAmount())
                .currency(order.getCurrency())
                .paymentMethod(order.getPaymentMethod())
                .feePolicyVersionId(orderSnapshotRepository.findById(orderId)
                        .map(OrderSnapshot::getPricingSnapshot)
                        .map(PricingSnapshot::getFeePolicyVersionId)
                        .orElse(null))
                .payableUntil(payableUntil)
                .scheduledStart(onsite == null ? null : onsite.getScheduledStart())
                .startedAt(order.getStartedAt())
                .build();
    }

    @Transactional
    public void expireIfDue(UUID orderId) {
        Order order=orderRepository.findByIdForUpdate(orderId).orElse(null);
        if (order!=null && order.getOrderStatus()==OrderStatus.PENDING_PAYMENT
                && order.getPaymentStatus()==PaymentStatus.PENDING && !clock.instant().isBefore(payableUntil(order)))
            cancellationService.cancelUnpaid(orderId);
    }

    public Instant payableUntil(Order order) {
        Instant until=order.getCreatedAt().plus(Duration.ofMinutes(paymentTimeoutMinutes));
        if (order.getExecutionType()==ExecutionType.ONSITE) {
            Instant slotExpiry=executionRepository.findByOrder_OrderId(order.getOrderId())
                    .flatMap(e->onsiteExecutionRepository.findByExecution_ExecutionId(e.getExecutionId()))
                    .map(OnsiteExecution::getSlotHoldExpiresAt).orElse(null);
            if (slotExpiry!=null && slotExpiry.isBefore(until)) until=slotExpiry;
        }
        return until;
    }

    @Transactional(readOnly = true)
    public InternalOrderTrustSnapshot getTrustSnapshot(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        OnsiteExecution onsite = order.getExecutionType() == ExecutionType.ONSITE
                ? executionRepository.findByOrder_OrderId(orderId)
                        .flatMap(e -> onsiteExecutionRepository.findByExecution_ExecutionId(e.getExecutionId()))
                        .orElse(null)
                : null;

        return InternalOrderTrustSnapshot.builder()
                .orderId(order.getOrderId())
                .orderNumber(order.getOrderNumber())
                .clientId(order.getClientId())
                .providerId(order.getProviderId())
                .serviceId(order.getServiceId())
                .sourceType(order.getSourceType())
                .executionType(order.getExecutionType())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .placedAt(order.getPlacedAt())
                .deliveredAt(order.getDeliveredAt())
                .completedAt(order.getCompletedAt())
                .cancelledAt(order.getCancelledAt())
                .scheduledStart(onsite == null ? null : onsite.getScheduledStart())
                .scheduledEnd(onsite == null ? null : onsite.getScheduledEnd())
                .startedAt(order.getStartedAt())
                .build();
    }

    //khong gui thi mac dinh vi, DIGITAL chon tien mat -> chan
    private OrderPaymentMethod resolvePaymentMethod(ExecutionType executionType, OrderPaymentMethod requested) {

        OrderPaymentMethod paymentMethod = requested == null ? OrderPaymentMethod.WALLET : requested;

        if (!paymentMethod.allowedFor(executionType)) {
            throw new AppException(ErrorCode.ORDER_PAYMENT_METHOD_NOT_ALLOWED);
        }

        return paymentMethod;
    }

    //D07 pilot: cash toi da 2tr/don, moi provider 1 don cash chua ket thuc (gom ca don cho xac nhan nhan tien)
    private void assertCashAllowed(UUID providerId, BigDecimal amount) {

        if (amount.compareTo(cashMaxAmount) > 0) {
            throw new AppException(ErrorCode.ORDER_CASH_LIMIT_EXCEEDED);
        }

        lockCreation("order-cash:" + providerId);

        long openCashOrders = orderRepository.countByProviderIdAndPaymentMethodAndOrderStatusNotIn(
                providerId, OrderPaymentMethod.CASH, List.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED));

        if (openCashOrders >= cashMaxOpenPerProvider) {
            throw new AppException(ErrorCode.ORDER_CASH_PROVIDER_BUSY);
        }
    }

    //slot HELD -> BOOKED va sinh ma checkin, slot het han giu -> null
    private OnsiteExecution bookOnsiteSlot(Order order) {

        Execution execution = executionRepository.findByOrder_OrderId(order.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        OnsiteExecution onsite = onsiteExecutionRepository
                .findByExecution_ExecutionId(execution.getExecutionId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_EXECUTION_NOT_FOUND));

        if (!confirmSlot(onsite.getBookingSlotId(), order.getOrderId())) {
            return null;
        }

        String checkinCode = generateCheckinCode();
        onsite.setCheckinCodeHash(passwordEncoder.encode(checkinCode));
        onsite.setCheckinCodeEncrypted(checkinCodeEncryptor.encrypt(checkinCode));

        return onsiteExecutionRepository.save(onsite);
    }

    //sinh ra ma code checkin
    private String generateCheckinCode() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private boolean confirmSlot(UUID slotId, UUID orderId) {
        try {
            catalogClient.confirmSlot(slotId, SlotActionRequest.builder()
                    .orderId(orderId)
                    .build());
            return true;
        } catch (FeignException e) {
            if (e.status() == HttpStatus.CONFLICT.value()) {
                return false;
            }
            throw new AppException(ErrorCode.CATALOG_UNAVAILABLE);
        }
    }

    private PaymentConfirmationResponse<Object> toConfirmationResponse(Order order, Object executionStatus) {
        return PaymentConfirmationResponse.builder()
                .orderId(order.getOrderId())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .executionStatus(executionStatus)
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

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(UUID orderId){

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        tokenUtils.assertParticipant(order);

        return toOrderDetail(order);
    }

    public OrderDetailResponse toOrderDetail(Order order){

        UUID orderId = order.getOrderId();

        List<OrderItemResponse> items = orderItemRepository
                .findByOrder_OrderIdOrderBySortOrderAsc(orderId)
                .stream()
                .map(orderItemMapper::toOrderItemResponse)
                .toList();

        OrderSnapshotResponse snapshot = orderSnapshotRepository.findById(orderId)
                .map(orderSnapshotMapper::toOrderSnapshotResponse)
                .orElse(null);

        return OrderDetailResponse.builder()
                .order(orderMapper.toOrderResponse(order))
                .items(items)
                .snapshot(snapshot)
                .execution(executionService.getExecutionOfOrder(order))
                .build();
    }

    public PageResponse<OrderStatusHistoryResponse> getOrderHistory(UUID orderId, int page, int size){

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        tokenUtils.assertParticipant(order);

        return historyOf(orderId, page, size);
    }

    public PageResponse<OrderStatusHistoryResponse> historyOf(UUID orderId, int page, int size){

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

    private void assertItemsTotalMatchesSubtotal(List<OrderItem> items, BigDecimal subtotal) {

        BigDecimal itemsTotal = items.stream()
                .filter(item -> item.getItemType() == ItemType.PACKAGE
                        || item.getItemType() == ItemType.ADDON)
                .map(OrderItem::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (itemsTotal.compareTo(subtotal) != 0) {
            throw new AppException(ErrorCode.ORDER_ITEM_TOTAL_MISMATCH);
        }
    }

    private String generateOrderNumber(){
        String date = clock.instant().toString();
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
                              BigDecimal providerNetAmount,
                              FeePolicyResponse feePolicy, String rewardQuoteRef) {

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

        OnsiteExecution scheduled=order.getExecutionType()==ExecutionType.ONSITE
                ? executionRepository.findByOrder_OrderId(order.getOrderId())
                    .flatMap(e->onsiteExecutionRepository.findByExecution_ExecutionId(e.getExecutionId())).orElse(null):null;
        orderSnapshotRepository.save(OrderSnapshot.builder()
                .rewardQuoteRef(rewardQuoteRef)
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
                .pricingSnapshot(orderFeeService.pricing(feePolicy)
                        .subtotal(subtotal)
                        .platformFee(platformFee)
                        .totalAmount(totalAmount)
                        .providerNetAmount(providerNetAmount)
                        .currency(order.getCurrency())
                        .paymentMethod(order.getPaymentMethod())
                        .build())
                .providerSnapshot(ProviderSnapshot.builder()
                        .providerId(serviceResponse.getProviderId())
                        .businessName(provider.getBusinessName())
                        .build())
                .executionSnapshot(ExecutionSnapshot.builder()
                        .executionType(serviceResponse.getExecutionType())
                        .address(serviceResponse.getExecutionType() == ExecutionType.ONSITE
                                ? request.getAddress() : null)
                        .scheduleStart(scheduled==null?null:scheduled.getScheduledStart())
                        .scheduleEnd(scheduled==null?null:scheduled.getScheduledEnd())
                        .autoCompleteHours(serviceResponse.getExecutionType() == ExecutionType.ONSITE
                                ? 24 : 72)
                        .build())
                .requirementValues(null)
                .build());
    }

}
