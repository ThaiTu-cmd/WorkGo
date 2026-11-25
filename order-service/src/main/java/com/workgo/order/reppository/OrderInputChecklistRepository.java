package com.workgo.order.reppository;
import com.workgo.order.entity.OrderInputChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface OrderInputChecklistRepository extends JpaRepository<OrderInputChecklist, UUID> {
    Optional<OrderInputChecklist> findTopByOrderIdOrderByChecklistVersionDesc(UUID orderId);
}
