package com.workgo.payment.service.wallet;

import com.workgo.payment.enumeration.WalletAccountType;

import java.util.UUID;

public record WalletAccountRef(WalletAccountType type, UUID ownerId) {

    public static WalletAccountRef userAvailable(UUID userId) {
        return new WalletAccountRef(WalletAccountType.USER_AVAILABLE, userId);
    }

    public static WalletAccountRef orderHeld(UUID orderId) {
        return new WalletAccountRef(WalletAccountType.ORDER_HELD, orderId);
    }

    //tien dang cho chi ra ngan hang: khong con kha dung, chua phai da ve tai khoan user
    public static WalletAccountRef payoutPending(UUID userId) {
        return new WalletAccountRef(WalletAccountType.PAYOUT_PENDING, userId);
    }

    public static WalletAccountRef platformRevenue() {
        return new WalletAccountRef(WalletAccountType.PLATFORM_REVENUE, null);
    }

    public static WalletAccountRef externalClearing() {
        return new WalletAccountRef(WalletAccountType.EXTERNAL_CLEARING, null);
    }

    //tai khoan theo user/order phai co owner, tai khoan he thong thi khong
    public String ownerKey() {
        boolean needsOwner = type == WalletAccountType.USER_AVAILABLE || type == WalletAccountType.ORDER_HELD
                || type == WalletAccountType.PAYOUT_PENDING;
        if (needsOwner != (ownerId != null)) throw new IllegalArgumentException("Invalid owner for " + type);
        return needsOwner ? ownerId.toString() : type.name();
    }
}
