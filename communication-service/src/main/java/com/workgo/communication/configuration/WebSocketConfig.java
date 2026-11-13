package com.workgo.communication.configuration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final WebSocketProperties properties;
    private final WebSocketAuthChannelInterceptor authentication;
    private final WebSocketSessionRegistry sessions;
    private final TaskScheduler heartbeat;

    public WebSocketConfig(WebSocketProperties properties, WebSocketAuthChannelInterceptor authentication,
            WebSocketSessionRegistry sessions, @Qualifier("webSocketHeartbeatScheduler") TaskScheduler heartbeat) {
        this.properties = properties;
        this.authentication = authentication;
        this.sessions = sessions;
        this.heartbeat = heartbeat;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.setErrorHandler(new StompSubProtocolErrorHandler() {
            @Override protected Message<byte[]> handleInternal(StompHeaderAccessor headers, byte[] payload,
                    Throwable error, StompHeaderAccessor clientHeaders) {
                headers.setMessage("Frame rejected");
                return super.handleInternal(headers, payload, error, clientHeaders);
            }
        });
        registry.addEndpoint("/ws").setAllowedOrigins(properties.getAllowedOrigins().toArray(String[]::new))
                .addInterceptors(new HandshakeInterceptor() {
                    @Override public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                            WebSocketHandler handler, Map<String, Object> attributes) {
                        if (request.getURI().getRawQuery() != null) {
                            response.setStatusCode(HttpStatus.BAD_REQUEST); return false;
                        }
                        if (!sessions.hasCapacity()) {
                            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS); return false;
                        }
                        return true;
                    }
                    @Override public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                            WebSocketHandler handler, Exception exception) { }
                });
    }

    @Override public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue").setTaskScheduler(heartbeat)
                .setHeartbeatValue(new long[]{properties.getHeartbeatMs(), properties.getHeartbeatMs()});
        registry.setUserDestinationPrefix("/user");
        registry.setPreservePublishOrder(true);
    }

    @Override public void configureClientInboundChannel(ChannelRegistration registration) {
        // Keep SUBSCRIBE/UNSUBSCRIBE and disconnect cleanup ordered per transport.
        // The receive-order decorator in Spring 6.1 swallows preSend failures; an async
        // bounded executor may run rejected tasks inline and reorder broker operations.
        registration.executor(new SyncTaskExecutor());
        registration.interceptors(authentication);
    }

    @Override public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(properties.getMessageSizeLimit())
                .setTimeToFirstMessage(properties.getConnectTimeoutMs())
                .setSendBufferSizeLimit(properties.getMessageSizeLimit() * 2)
                .setSendTimeLimit(10000)
                .addDecoratorFactory(handler -> new WebSocketHandlerDecorator(handler) {
                    @Override public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                        if (!sessions.open(session)) { session.close(CloseStatus.POLICY_VIOLATION); return; }
                        try { super.afterConnectionEstablished(session); }
                        catch (Exception error) { sessions.close(session.getId()); throw error; }
                    }
                    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
                        try { super.afterConnectionClosed(session, status); }
                        finally { sessions.remove(session.getId()); }
                    }
                    @Override public void handleTransportError(WebSocketSession session, Throwable error) throws Exception {
                        sessions.close(session.getId());
                        super.handleTransportError(session, error);
                    }
                });
    }

    @Bean
    ServletServerContainerFactoryBean webSocketContainer() {
        var container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(properties.getMessageSizeLimit());
        container.setMaxBinaryMessageBufferSize(properties.getMessageSizeLimit());
        return container;
    }
}
