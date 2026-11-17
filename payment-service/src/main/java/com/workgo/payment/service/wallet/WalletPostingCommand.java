package com.workgo.payment.service.wallet;

import com.workgo.payment.enumeration.WalletPostingType;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletPostingCommand {

    String idempotencyKey;

    WalletPostingType postingType;

    UUID obligationId;

    String description;

    List<WalletPostingLeg> legs;
}
