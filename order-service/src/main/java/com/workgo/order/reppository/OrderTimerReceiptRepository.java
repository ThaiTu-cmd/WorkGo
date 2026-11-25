package com.workgo.order.reppository;
import com.workgo.order.entity.OrderTimerReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface OrderTimerReceiptRepository extends JpaRepository<OrderTimerReceipt,UUID> {}
