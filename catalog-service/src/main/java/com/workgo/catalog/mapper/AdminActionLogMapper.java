package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.response.AdminActionLogResponse;
import com.workgo.catalog.entity.AdminActionLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AdminActionLogMapper {

    AdminActionLogResponse toAdminActionLogResponse(AdminActionLog adminActionLog);
}
