package com.workgo.trust.dto.request.client;
import java.util.UUID;
public record TimerResumeCommand(String sourceType,UUID sourceId,UUID resumeCommandId,boolean requireNewDelivery) {}
