package com.workgo.payment.service.admin;

import com.workgo.payment.enumeration.AdminActionType;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminAction {

    AdminActionType action;

    String targetType;

    UUID targetId;

    String reason;

    Object beforeState;

    Object afterState;
}
