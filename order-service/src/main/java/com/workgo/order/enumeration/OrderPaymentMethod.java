package com.workgo.order.enumeration;

public enum OrderPaymentMethod {
    WALLET,
    CASH;

    //DIGITAL chi tra bang vi WorkGo, ONSITE duoc chon vi hoac tien mat
    public boolean allowedFor(ExecutionType executionType){
        return this == WALLET || executionType == ExecutionType.ONSITE;
    }
}
