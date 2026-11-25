package com.workgo.order.service.meet;
import java.util.UUID;
public interface MeetClient {
    /** Only for failures where no room-creation request could have succeeded. */
    class NotCreatedException extends RuntimeException {
        public NotCreatedException(){super("Meet authorization or request rejected before creation");}
    }
    record Space(String name,String meetingUri) {}
    void assertAuthorized(UUID hostAuthorizationRef);
    Space createSpace(UUID previewId,UUID hostAuthorizationRef);
    Space lookupSpace(UUID hostAuthorizationRef,String externalName);
}
