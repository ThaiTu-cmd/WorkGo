package com.workgo.payment.mapper;

import com.workgo.payment.dto.response.AdminActionLogResponse;
import com.workgo.payment.entity.AdminActionLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AdminActionLogMapper {

    AdminActionLogResponse toAdminActionLogResponse(AdminActionLog adminActionLog);
}
