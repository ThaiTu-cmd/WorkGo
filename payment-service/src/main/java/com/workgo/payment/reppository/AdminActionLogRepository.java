package com.workgo.payment.reppository;

import com.workgo.payment.entity.AdminActionLog;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.UUID;

public interface AdminActionLogRepository extends Repository<AdminActionLog, UUID> {

    AdminActionLog save(AdminActionLog adminActionLog);

    List<AdminActionLog> findAllByTargetTypeAndTargetIdOrderByCreatedAtAsc(String targetType, String targetId);
}
