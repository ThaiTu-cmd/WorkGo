package com.workgo.payment.enumeration;

public enum PaymentMethod {
    QR,
    WALLET,
    ATM_CARD,
    INTL_CARD,
    CASH;

    //WALLET o day la vi cua cong (MoMo...), khong phai vi WorkGo; CASH khong di qua cong
    public boolean viaGateway(){
        return this == QR || this == ATM_CARD || this == INTL_CARD;
    }
}
