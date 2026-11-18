package com.workgo.identity.Mapper;

import com.workgo.identity.dto.response.AdminActionLogResponse;
import com.workgo.identity.entity.AdminActionLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AdminActionLogMapper {

    AdminActionLogResponse toAdminActionLogResponse(AdminActionLog adminActionLog);
}
