package com.workgo.payment.service.wallet;

import com.workgo.payment.entity.WalletAccount;
import com.workgo.payment.reppository.WalletAccountRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class WalletAccountProvisioner {

    WalletAccountRepository walletAccountRepository;

    //transaction rieng: 2 request cung tao 1 tai khoan thi ben thua chi rollback phan tao, khong hong lenh chinh
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public UUID ensure(WalletAccountRef ref) {

        String type = ref.type().name();
        String ownerKey = ref.ownerKey();

        return walletAccountRepository.findByAccountTypeAndOwnerKey(type, ownerKey)
                .map(WalletAccount::getWalletAccountId)
                .orElseGet(() -> walletAccountRepository.saveAndFlush(WalletAccount.builder()
                        .accountType(type)
                        .ownerKey(ownerKey)
                        .build()).getWalletAccountId());
    }
}
