package com.workgo.trust.dto.request.client;
import java.util.UUID;
public record TimerPauseCommand(String sourceType,UUID sourceId,Long expectedVersion) {}
