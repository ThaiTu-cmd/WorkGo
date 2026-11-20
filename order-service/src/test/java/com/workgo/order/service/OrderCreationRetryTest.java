package com.workgo.order.service;

import com.workgo.order.dto.request.OrderCreationRequest;
import com.workgo.order.dto.response.OrderResponse;
import com.workgo.order.dto.response.client.*;
import com.workgo.order.dto.snapshot.PricingSnapshot;
import com.workgo.order.entity.*;
import com.workgo.order.enumeration.*;
import com.workgo.order.enumeration.client.*;
import com.workgo.order.exception.AppException;
import com.workgo.order.exception.ErrorCode;
import com.workgo.order.mapper.*;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.*;
import com.workgo.order.utils.TokenUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DataJpaTest(showSql = false)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({OrderService.class, com.fasterxml.jackson.databind.ObjectMapper.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@TestPropertySource(properties = {
        "spring.datasource.url=${WORKGO_TEST_DB_URL}",
        "spring.datasource.username=${WORKGO_TEST_DB_USER}",
        "spring.datasource.password=${WORKGO_TEST_DB_PASSWORD}",
        "spring.jpa.hibernate.ddl-auto=update", "spring.jpa.show-sql=false"
})
@EnabledIfEnvironmentVariable(named = "WORKGO_TEST_DB_URL", matches = "jdbc:postgresql:.*")
class OrderCreationRetryTest {
    @Autowired OrderService service;
    @Autowired OrderRepository orders;
    @MockBean OrderMapper mapper;
    @MockBean OrderStatusHistoryMapper historyMapper;
    @MockBean CatalogClient catalog;
    @MockBean IdentityClient identity;
    @MockBean OrderStatusService statuses;
    @MockBean OrderSnapshotRepository snapshots;
    @MockBean OrderStatusHistoryRepository history;
    @MockBean OrderItemRepository items;
    @MockBean OrderItemMapper itemMapper;
    @MockBean OrderSnapshotMapper snapshotMapper;
    @MockBean ExecutionService executions;
    @MockBean ExecutionRepository executionRepository;
    @MockBean OnsiteExecutionRepository onsiteRepository;
    @MockBean PasswordEncoder passwords;
    @MockBean TextEncryptor encryptor;
    @MockBean CancellationService cancellations;
    @MockBean OrderFeeService fees;
    @MockBean ProviderFinancialEligibility eligibility;
    @MockBean TokenUtils tokens;

    UUID client, provider, serviceId, packageId;

    @BeforeEach
    void fixtures() {
        client = UUID.randomUUID(); provider = UUID.randomUUID();
        serviceId = UUID.randomUUID(); packageId = UUID.randomUUID();
        when(tokens.getCurrentUserId()).thenAnswer(i -> client);
        when(tokens.hasRole("ROLE_CLIENT")).thenReturn(true);
        when(catalog.getService(serviceId)).thenReturn(ServiceResponse.builder()
                .serviceId(serviceId).providerId(provider).status(ServiceStatus.PUBLISHED)
                .executionType(ExecutionType.DIGITAL).title("Retry test").build());
        when(catalog.getPackage(packageId)).thenReturn(PackageResponse.builder()
                .packageId(packageId).serviceId(serviceId).packageStatus(PackageStatus.ACTIVE)
                .price(new BigDecimal("100000")).name("Standard").build());
        when(identity.getProviderProfile(provider)).thenReturn(ProviderProfileResponse.builder().build());
        var policy = FeePolicyResponse.builder().successFeeRate(new BigDecimal("0.1")).build();
        when(fees.currentPolicy()).thenReturn(policy);
        when(fees.successFee(any(), any())).thenReturn(new BigDecimal("10000"));
        when(fees.pricing(any())).thenAnswer(i -> PricingSnapshot.builder());
        when(mapper.toOrderResponse(any())).thenAnswer(i -> {
            Order o = i.getArgument(0);
            return OrderResponse.builder().orderId(o.getOrderId()).orderStatus(o.getOrderStatus()).build();
        });
        when(executionRepository.findByOrder_OrderId(any())).thenReturn(Optional.of(
                Execution.builder().executionId(UUID.randomUUID()).build()));
        when(onsiteRepository.findByExecution_ExecutionId(any())).thenAnswer(i -> Optional.of(
                OnsiteExecution.builder().bookingSlotId(UUID.randomUUID()).build()));
        when(onsiteRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    OrderCreationRequest request() {
        return OrderCreationRequest.builder().serviceId(serviceId).packageId(packageId).build();
    }

    OrderResponse create(OrderCreationRequest request, String key) {
        return service.createOrder(request, key);
    }

    @Test
    void identicalRetryReplaysCurrentOrderWithoutRecheckingCatalog() {
        var first = create(request(), "retry");
        Order saved = orders.findById(first.getOrderId()).orElseThrow();
        saved.setOrderStatus(OrderStatus.CANCELLED);
        orders.saveAndFlush(saved);
        clearInvocations(catalog, executions, snapshots, statuses);
        var retry = create(request(), "retry");
        assertEquals(first.getOrderId(), retry.getOrderId());
        assertEquals(OrderStatus.CANCELLED, retry.getOrderStatus());
        verifyNoInteractions(catalog, executions, snapshots, statuses);
    }

    @Test
    void sameKeyCannotChangePayloadOrReuseDeletedOrder() {
        var first = create(request(), "conflict");
        var changed = request(); changed.setAddress("Different address");
        assertEquals(409, assertThrows(AppException.class, () -> create(changed, "conflict"))
                .getErrorCode().getStatusCode().value());
        var deleted = orders.findById(first.getOrderId()).orElseThrow();
        deleted.setIsDeleted(1); orders.saveAndFlush(deleted);
        assertThrows(AppException.class, () -> create(request(), "conflict"));
    }

    @Test
    void keyIsScopedToClientAndDifferentKeysPermitNewPurchases() {
        var first = create(request(), "same");
        assertNotEquals(first.getOrderId(), create(request(), "new").getOrderId());
        client = UUID.randomUUID();
        assertNotEquals(first.getOrderId(), create(request(), "same").getOrderId());
    }

    @Test
    void defaultsNormalizeForRetryAndLegacyRequestsRemainIndependent() {
        var original = create(request(), "defaults");
        var explicit = request();
        explicit.setPaymentMethod(OrderPaymentMethod.WALLET);
        explicit.setAddonIds(List.of());
        assertEquals(original.getOrderId(), create(explicit, "defaults").getOrderId());
        assertNotEquals(create(request(), null).getOrderId(), create(request(), null).getOrderId());
    }

    @Test
    void malformedRequestsAndKeysFailBeforeRemoteCalls() {
        for (String key : List.of("", " ", "contains space", "x".repeat(129), "ký")) {
            assertEquals(ErrorCode.ORDER_CREATION_KEY_INVALID,
                    assertThrows(AppException.class, () -> create(request(), key)).getErrorCode());
        }
        var missingService = request(); missingService.setServiceId(null);
        var missingPackage = request(); missingPackage.setPackageId(null);
        assertEquals(ErrorCode.SERVICE_ID_REQUIRED, assertThrows(AppException.class,
                () -> create(missingService, "invalid")).getErrorCode());
        assertEquals(ErrorCode.PACKAGE_ID_REQUIRED, assertThrows(AppException.class,
                () -> create(missingPackage, "invalid")).getErrorCode());
        verifyNoInteractions(catalog);
    }

    @Test
    void roleIsRequiredEvenForAnExistingKey() {
        create(request(), "role");
        when(tokens.hasRole("ROLE_CLIENT")).thenReturn(false);
        assertEquals(ErrorCode.FORBIDDEN, assertThrows(AppException.class,
                () -> create(request(), "role")).getErrorCode());
    }

    @Test
    void failedTransactionDoesNotConsumeKey() {
        when(executions.createFor(any(), any(), any())).thenThrow(new AppException(ErrorCode.CATALOG_UNAVAILABLE));
        assertThrows(AppException.class, () -> create(request(), "rollback"));
        doReturn(null).when(executions).createFor(any(), any(), any());
        var order = create(request(), "rollback");
        assertEquals(order.getOrderId(), create(request(), "rollback").getOrderId());
    }

    @Test
    void concurrentSameKeyCreatesOneOrder() throws Exception {
        assertConcurrentCreation(true);
    }

    @Test
    void concurrentCashOrdersForProviderRespectOpenOrderLimit() throws Exception {
        assertConcurrentCreation(false);
    }

    void assertConcurrentCreation(boolean sameKey) throws Exception {
        CountDownLatch firstInExecution = new CountDownLatch(1), releaseFirst = new CountDownLatch(1);
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        when(executions.createFor(any(), any(), any())).thenAnswer(i -> {
            if (calls.incrementAndGet() == 1) {
                firstInExecution.countDown();
                assertTrue(releaseFirst.await(10, TimeUnit.SECONDS));
            }
            return null;
        });
        var a = request(); var b = request();
        if (!sameKey) {
            when(catalog.getService(serviceId)).thenReturn(ServiceResponse.builder()
                    .serviceId(serviceId).providerId(provider).status(ServiceStatus.PUBLISHED)
                    .executionType(ExecutionType.ONSITE).title("Cash race").build());
            a.setPaymentMethod(OrderPaymentMethod.CASH); b.setPaymentMethod(OrderPaymentMethod.CASH);
            a.setBookingSlotId(UUID.randomUUID()); b.setBookingSlotId(UUID.randomUUID());
        }
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> create(a, "concurrent-a"));
            assertTrue(firstInExecution.await(10, TimeUnit.SECONDS));
            var second = pool.submit(() -> create(b, sameKey ? "concurrent-a" : "concurrent-b"));
            boolean secondFinishedBeforeCommit;
            try { second.get(700, TimeUnit.MILLISECONDS); secondFinishedBeforeCommit = true; }
            catch (TimeoutException expected) { secondFinishedBeforeCommit = false; }
            finally { releaseFirst.countDown(); }
            var created = first.get(10, TimeUnit.SECONDS);
            if (sameKey) assertEquals(created.getOrderId(), second.get(10, TimeUnit.SECONDS).getOrderId());
            else {
                var failure = assertThrows(ExecutionException.class, () -> second.get(10, TimeUnit.SECONDS));
                assertInstanceOf(AppException.class, failure.getCause());
                assertEquals(ErrorCode.ORDER_CASH_PROVIDER_BUSY, ((AppException) failure.getCause()).getErrorCode());
            }
            assertFalse(secondFinishedBeforeCommit, "second request must wait for the first transaction");
        } finally { releaseFirst.countDown(); }
    }
}
