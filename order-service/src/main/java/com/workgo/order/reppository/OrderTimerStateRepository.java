package com.workgo.order.reppository;
import com.workgo.order.entity.OrderTimerState;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface OrderTimerStateRepository extends JpaRepository<OrderTimerState,UUID> {}
