package com.workgo.payment.service;

import com.workgo.payment.entity.*;
import com.workgo.payment.enumeration.FeeAssessmentStatus;
import com.workgo.payment.reppository.*;
import com.workgo.payment.reppository.client.CommunicationClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeeReminderService {
    private final FeeReminderRepository reminders;
    private final FeeAssessmentRepository fees;
    private final CommunicationClient communication;

    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(FeeAssessment fee) {
        for (int hours : new int[]{24, 168}) {
            FeeReminder reminder = new FeeReminder();
            reminder.setId(UUID.nameUUIDFromBytes(("FEE_REMINDER:" + fee.getFeeAssessmentId() + ":" + hours)
                    .getBytes(StandardCharsets.UTF_8)));
            reminder.setFeeAssessmentId(fee.getFeeAssessmentId());
            reminder.setMilestone(hours == 24 ? "24H" : "7D");
            reminder.setDueAt(fee.getCreatedAt().plus(hours, ChronoUnit.HOURS));
            reminders.save(reminder);
        }
    }

    @Transactional
    public void deliver(UUID id) {
        FeeReminder reminder = reminders.findLockedById(id).orElseThrow();
        Instant now = Instant.now();
        if (reminder.getDeliveredAt() != null || reminder.getCancelledAt() != null || reminder.getDueAt().isAfter(now)) return;
        FeeAssessment fee = fees.findById(reminder.getFeeAssessmentId()).orElseThrow();
        if (fee.getStatus() != FeeAssessmentStatus.OUTSTANDING || fee.getCollectedAmount() >= fee.getAmount()) {
            reminder.setCancelledAt(now);
            return;
        }
        // Immutable payload even after a partial collection: retries keep the same event hash.
        String type = "CANCELLATION_FEE_REMINDER_" + reminder.getMilestone();
        var response = communication.notify(new CommunicationClient.NotificationRequest(id, fee.getChargedUserId(),
                type, "Cancellation fee payment reminder", "Check your outstanding cancellation fee for this order.",
                "ORDER", fee.getOrderId()));
        var ack = response == null ? null : response.getResult();
        if (ack == null || ack.id() == null || !fee.getChargedUserId().equals(ack.recipientId())
                || !type.equals(ack.type()) || !"ORDER".equals(ack.referenceType()) || !fee.getOrderId().equals(ack.referenceId())) {
            throw new IllegalStateException("Invalid fee reminder ACK");
        }
        reminder.setDeliveredAt(now);
    }
}
