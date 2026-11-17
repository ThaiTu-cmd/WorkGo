package com.workgo.payment.service.wallet;

//amount > 0 la cong vao tai khoan, < 0 la tru
public record WalletPostingLeg(WalletAccountRef account, long amount) {
}
