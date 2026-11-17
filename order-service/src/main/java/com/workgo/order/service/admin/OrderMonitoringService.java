package com.workgo.order.service.admin;

import com.workgo.order.dto.PageResponse;
import com.workgo.order.dto.response.OrderDetailResponse;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.OrderStatusHistoryResponse;
import com.workgo.order.entity.Order;
import com.workgo.order.enumeration.ExecutionType;
import com.workgo.order.enumeration.OrderStatus;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.OrderMapper;
import com.workgo.order.reppository.OrderRepository;
import com.workgo.order.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class OrderMonitoringService {

    static int MAX_PAGE_SIZE = 100;

    OrderRepository orderRepository;
    OrderMapper orderMapper;
    OrderService orderService;

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PageResponse<OrderResponse> searchOrders(OrderStatus status, ExecutionType executionType,
                                                    UUID clientId, UUID providerId,
                                                    Instant from, Instant to, int page, int size) {

        Page<Order> pageData = orderRepository.searchForMonitoring(status, executionType, clientId, providerId,
                from, to, PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by("createdAt").descending()));

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
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public OrderDetailResponse getOrder(UUID orderId) {

        return orderService.toOrderDetail(loadOrder(orderId));
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PageResponse<OrderStatusHistoryResponse> getOrderHistory(UUID orderId, int page, int size) {

        loadOrder(orderId);

        return orderService.historyOf(orderId, page, Math.min(size, MAX_PAGE_SIZE));
    }

    //=====================================

    private Order loadOrder(UUID orderId) {

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }
}
