package com.workgo.identity.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.Instant;
@Entity @Table(name="sanction_appeals",uniqueConstraints=@UniqueConstraint(columnNames={"sanction_id","user_id"})) @Getter @Setter @NoArgsConstructor
public class SanctionAppeal {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false,name="sanction_id",updatable=false) private UUID sanctionId;
    @Column(nullable=false,name="user_id",updatable=false) private UUID userId;
    @Column(nullable=false,updatable=false,length=2000) private String explanation;
    @Column(nullable=false,updatable=false) private Instant submittedAt;
    @Column(nullable=false) private String status="PENDING";
    private UUID reviewedBy;
    private Instant reviewedAt;
    @Column(length=1000) private String decisionReason;
    @jakarta.persistence.Transient
    public Instant getReviewDueAt(){
        if(submittedAt==null)return null;
        var day=submittedAt.atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));int remaining=3;
        while(remaining>0){day=day.plusDays(1);if(day.getDayOfWeek()!=java.time.DayOfWeek.SATURDAY&&day.getDayOfWeek()!=java.time.DayOfWeek.SUNDAY)remaining--;}
        return day.toInstant();
    }
    @Version private Long version;
}
