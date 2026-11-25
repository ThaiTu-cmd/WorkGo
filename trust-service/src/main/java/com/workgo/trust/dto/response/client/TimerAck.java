package com.workgo.trust.dto.response.client;
import java.time.Instant;
import java.util.UUID;
public record TimerAck(UUID orderId,UUID commandId,Long timerVersion,Boolean paused,Instant resumeAt,Boolean requiresNewDelivery) {}
