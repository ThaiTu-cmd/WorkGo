package com.workgo.order.controller.internal;
import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import org.springframework.jdbc.core.JdbcTemplate;import java.util.*;
@RestController @RequiredArgsConstructor @RequestMapping("/internal/providers")
public class InternalAdmissionStatsController {
    private final JdbcTemplate jdbc;
    public record Success(UUID orderId,UUID clientId,UUID recoveryGrantId,String paymentStatus){}
    public record Stats(UUID providerId,long activeOrders,List<UUID> consumedRecoveryGrants,List<Success> successfulRecoveries){}
    @GetMapping("/{id}/admission-stats")public Stats stats(@PathVariable UUID id){
        long active=jdbc.queryForObject("select count(*) from orders where provider_id=? and order_status not in ('COMPLETED','CANCELLED')",Long.class,id);
        var consumed=jdbc.query("select recovery_grant_id from orders where provider_id=? and recovery_grant_id is not null",(rs,n)->rs.getObject(1,UUID.class),id);
        var success=jdbc.query("select order_id,client_id,recovery_grant_id,payment_status from orders where provider_id=? and recovery_grant_id is not null and order_status='COMPLETED' and payment_status in ('RELEASED','CASH_SETTLED')",(rs,n)->new Success(rs.getObject(1,UUID.class),rs.getObject(2,UUID.class),rs.getObject(3,UUID.class),rs.getString(4)),id);
        return new Stats(id,active,consumed,success);
    }
}
