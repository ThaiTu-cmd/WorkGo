package com.workgo.payment.enumeration;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.Set;

import static com.workgo.payment.enumeration.WalletAccountType.*;

//moi loai but toan chi duoc tru (debit) / cong (credit) dung loai tai khoan
@Getter
@AllArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public enum WalletPostingType {
    TOP_UP(Set.of(EXTERNAL_CLEARING), Set.of(USER_AVAILABLE), false),
    ORDER_HOLD(Set.of(USER_AVAILABLE), Set.of(ORDER_HELD), false),
    ORDER_RELEASE(Set.of(ORDER_HELD), Set.of(USER_AVAILABLE, PLATFORM_REVENUE), false),
    ORDER_REFUND(Set.of(ORDER_HELD), Set.of(USER_AVAILABLE, PLATFORM_REVENUE), false),
    CANCELLATION_FEE(Set.of(USER_AVAILABLE), Set.of(PLATFORM_REVENUE), false),
    CASH_SUCCESS_FEE(Set.of(USER_AVAILABLE), Set.of(PLATFORM_REVENUE), true),
    PAYOUT_HOLD(Set.of(USER_AVAILABLE), Set.of(PAYOUT_PENDING), false),
    PAYOUT_PAID(Set.of(PAYOUT_PENDING), Set.of(EXTERNAL_CLEARING), false),
    PAYOUT_RETURN(Set.of(PAYOUT_PENDING), Set.of(USER_AVAILABLE), false);

    Set<WalletAccountType> debitTypes;
    Set<WalletAccountType> creditTypes;
    boolean allowNegativeAvailable;
}
