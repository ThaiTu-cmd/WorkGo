package com.workgo.order.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="meet_authorizations") @Getter @Setter @JsonIgnoreType
public class MeetAuthorization {
    @Id private UUID userId;
    @Version private Long version;
    @Column(columnDefinition="text") private String encryptedRefreshToken;
    private String state;
    private Instant stateExpiresAt;
    private String scope;
}
