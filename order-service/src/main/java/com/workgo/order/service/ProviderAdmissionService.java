package com.workgo.order.service;
import com.workgo.order.reppository.*;
import com.workgo.order.reppository.client.*;
import com.workgo.order.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.UUID;
@Service @RequiredArgsConstructor
public class ProviderAdmissionService {
    private final ProviderAdmissionRepository rows;
    private final ProviderAdmissionInitializer initializer;
    private final TrustClient trust;
    private final IdentityClient identity;
    private final JdbcTemplate jdbc;
    private final ProviderRestrictionProjectionRepository restrictions;
    public static int cap(int score,boolean isNew) {
        if(score<20)return 0;
        if(isNew&&score>=80)return 1;
        return score>=80?5:score>=60?3:score>=40?2:1;
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void reserve(UUID provider) {
        try{initializer.ensure(provider);}catch(DataIntegrityViolationException race){if(!rows.existsById(provider))throw race;}
        var reservation=rows.lock(provider).orElseThrow();reservation.setReservationGrantId(null);
        if(restrictions.existsByProviderIdAndBlockedTrueAndSourceNot(provider,"REPUTATION"))throw new AppException(ErrorCode.PROVIDER_ADMISSION_BLOCKED);
        try {
            var profile=identity.getProviderProfile(provider);
            var response=trust.reputation(provider);
            var score=response==null?null:response.getResult();
            var eligibility=identity.admission(provider);
            if(profile==null || !provider.equals(profile.getProviderProfileId())
                    ||profile.getVerificationStatus()!=com.workgo.order.enumeration.client.VerificationStatus.VERIFIED
                    ||eligibility==null||!provider.equals(eligibility.providerId())||!eligibility.mayReceiveNewOrders()
                    ||score==null||!provider.equals(score.providerId())||response.getCode()!=1000||score.score()<0||score.score()>100)
                throw new IllegalStateException();
            long completed=jdbc.queryForObject("select count(*) from orders where provider_id=? and order_status='COMPLETED' and payment_status in ('RELEASED','CASH_SETTLED')",Long.class,provider);
            long clients=jdbc.queryForObject("select count(distinct client_id) from orders where provider_id=? and order_status='COMPLETED' and payment_status in ('RELEASED','CASH_SETTLED')",Long.class,provider);
            // Pending payments reserve a slot until the normal expiry workflow releases them.
            long active=jdbc.queryForObject("select count(*) from orders where provider_id=? and order_status not in ('COMPLETED','CANCELLED')",Long.class,provider);
            if(score.score()>=5&&score.score()<20&&eligibility.recoveryGrantId()!=null&&active==0
                    &&!eligibility.recoveryGrantId().equals(reservation.getLastConsumedRecoveryGrantId())){
                reservation.setLastConsumedRecoveryGrantId(eligibility.recoveryGrantId());reservation.setReservationGrantId(eligibility.recoveryGrantId());rows.save(reservation);return;
            }
            if(active>=cap(score.score(),completed<3||clients<3))throw new AppException(ErrorCode.PROVIDER_ADMISSION_BLOCKED);
        }catch(AppException e){throw e;}catch(RuntimeException e){throw new AppException(ErrorCode.PROVIDER_ADMISSION_UNAVAILABLE);}
    }
    public UUID reservationGrant(UUID provider){return rows.findById(provider).map(com.workgo.order.entity.ProviderAdmission::getReservationGrantId).orElse(null);}
}
