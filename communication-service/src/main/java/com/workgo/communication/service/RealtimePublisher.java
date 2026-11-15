package com.workgo.communication.service;

import com.workgo.communication.dto.response.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimePublisher {
    private final SimpMessagingTemplate messaging;

    public void message(MessageDto message) {
        try { messaging.convertAndSend("/topic/conversations/" + message.conversationId(), message); }
        catch (RuntimeException e) { log.warn("Message realtime push failed: {}", e.getClass().getSimpleName()); }
    }

    public void notification(NotificationDto notification) {
        try { messaging.convertAndSendToUser(notification.recipientId().toString(), "/queue/notifications", notification); }
        catch (RuntimeException e) { log.warn("Notification realtime push failed: {}", e.getClass().getSimpleName()); }
    }
}
