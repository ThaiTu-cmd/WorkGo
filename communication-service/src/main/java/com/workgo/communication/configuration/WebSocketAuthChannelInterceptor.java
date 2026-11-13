package com.workgo.communication.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {
    private final IdentityTokenIntrospector introspector;
    private final CustomJwtDecoder decoder;
    private final JwtAuthenticationConverter converter;
    private final ConversationMembershipChecker membership;
    private final WebSocketSessionRegistry sessions;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        var accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) throw new AccessDeniedException("STOMP frame required");
        String id = accessor.getSessionId();
        StompCommand command = accessor.getCommand();
        var headers = accessor.getNativeHeader("Authorization");
        accessor.removeNativeHeader("Authorization");
        // Spring also publishes DISCONNECT while tearing down an already removed transport.
        if (command == StompCommand.DISCONNECT) return message;
        if (command == StompCommand.CONNECT || command == StompCommand.STOMP) {
            if (headers == null || headers.size() != 1 || !headers.getFirst().startsWith("Bearer ")) {
                throw new AccessDeniedException("Bearer credentials required");
            }
            String token = headers.getFirst().substring(7);
            if (!introspector.isValid(token)) throw new AccessDeniedException("CONNECT rejected");
            var authentication = (JwtAuthenticationToken) converter.convert(decoder.decode(token));
            sessions.authenticate(id, authentication);
            accessor.setUser(authentication);
            return message;
        }

        var authentication = sessions.authentication(id);
        accessor.setUser(authentication);
        if (command == StompCommand.SUBSCRIBE) {
            String destination = accessor.getDestination();
            if (!"/user/queue/notifications".equals(destination)) {
                String prefix = "/topic/conversations/";
                if (destination == null || !destination.startsWith(prefix)) throw new AccessDeniedException("Destination denied");
                String value = destination.substring(prefix.length());
                UUID conversationId;
                try {
                    conversationId = UUID.fromString(value);
                    if (!conversationId.toString().equalsIgnoreCase(value)) throw new IllegalArgumentException();
                } catch (IllegalArgumentException exception) { throw new AccessDeniedException("Destination denied"); }
                if (!membership.isParticipant(conversationId, UUID.fromString(authentication.getName()))) {
                    throw new AccessDeniedException("Conversation membership required");
                }
            }
            sessions.subscribe(id, accessor.getSubscriptionId(), destination);
        } else if (command == StompCommand.UNSUBSCRIBE) {
            sessions.unsubscribe(id, accessor.getSubscriptionId());
        } else if (command != StompCommand.DISCONNECT && command != null) {
            throw new AccessDeniedException("Client command denied");
        }
        return message;
    }
}
