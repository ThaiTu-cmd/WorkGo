package com.workgo.payment.service.wallet;

import java.util.List;
import java.util.UUID;

public record WalletPostingResult(UUID walletTransactionId, boolean replayed, List<Entry> entries) {

    public record Entry(UUID walletAccountId, String accountType, String ownerKey, long amount, long balanceAfter) {
    }
}
