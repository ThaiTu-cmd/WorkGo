package com.workgo.payment.service.wallet;

import com.workgo.payment.entity.WalletAccount;
import com.workgo.payment.entity.WalletLedgerEntry;
import com.workgo.payment.entity.WalletTransaction;
import com.workgo.payment.enumeration.WalletAccountType;
import com.workgo.payment.enumeration.WalletPostingType;
import com.workgo.payment.exception.AppException;
import com.workgo.payment.exception.ErrorCode;
import com.workgo.payment.reppository.WalletAccountRepository;
import com.workgo.payment.reppository.WalletTransactionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class WalletService {

    WalletAccountRepository walletAccountRepository;
    WalletTransactionRepository walletTransactionRepository;
    WalletAccountProvisioner walletAccountProvisioner;

    @Transactional
    public WalletPostingResult post(WalletPostingCommand command) {

        assertValid(command);
        String payloadHash = payloadHash(command);

        Optional<WalletPostingResult> replay = replayIfPosted(command.getIdempotencyKey(), payloadHash);
        if (replay.isPresent()) return replay.get();

        Map<WalletAccountRef, UUID> accountIds = new HashMap<>();
        for (WalletPostingLeg leg : command.getLegs()) {
            accountIds.computeIfAbsent(leg.account(), this::ensureAccount);
        }

        //khoa theo thu tu id co dinh de 2 lenh dong thoi khong deadlock
        Map<UUID, WalletAccount> locked = new HashMap<>();
        accountIds.values().stream().distinct().sorted(Comparator.naturalOrder()).forEach(id ->
                locked.put(id, walletAccountRepository.findByIdForUpdate(id)
                        .orElseThrow(() -> new AppException(ErrorCode.WALLET_POSTING_INVALID))));

        //lenh cung key vua commit trong luc cho khoa
        replay = replayIfPosted(command.getIdempotencyKey(), payloadHash);
        if (replay.isPresent()) return replay.get();

        WalletTransaction transaction = WalletTransaction.builder()
                .idempotencyKey(command.getIdempotencyKey())
                .postingType(command.getPostingType().name())
                .obligationId(command.getObligationId())
                .description(command.getDescription())
                .payloadHash(payloadHash)
                .build();

        Instant now = Instant.now();
        for (WalletPostingLeg leg : command.getLegs()) {
            WalletAccount account = locked.get(accountIds.get(leg.account()));
            long balanceAfter = account.getBalance() + leg.amount();

            assertBalanceAllowed(command.getPostingType(), leg, balanceAfter);

            account.setBalance(balanceAfter);
            account.setUpdatedAt(now);

            transaction.getEntries().add(WalletLedgerEntry.builder()
                    .transaction(transaction)
                    .account(account)
                    .amount(leg.amount())
                    .balanceAfter(balanceAfter)
                    .build());
        }

        return toResult(walletTransactionRepository.save(transaction), false);
    }

    @Transactional(readOnly = true)
    public long balanceOf(WalletAccountRef ref) {

        return walletAccountRepository.findByAccountTypeAndOwnerKey(ref.type().name(), ref.ownerKey())
                .map(WalletAccount::getBalance)
                .orElse(0L);
    }

    //khoa tai khoan truoc khi doc so du de tinh so tien duoc tru, giu khoa toi het transaction
    @Transactional(propagation = Propagation.MANDATORY)
    public long lockedBalanceOf(WalletAccountRef ref) {

        return walletAccountRepository.findByIdForUpdate(ensureAccount(ref))
                .map(WalletAccount::getBalance)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_POSTING_INVALID));
    }

    //=====================================

    private void assertValid(WalletPostingCommand command) {

        List<WalletPostingLeg> legs = command.getLegs();

        if (command.getIdempotencyKey() == null || command.getIdempotencyKey().isBlank()
                || command.getPostingType() == null || command.getObligationId() == null
                || legs == null || legs.size() < 2) {
            throw new AppException(ErrorCode.WALLET_POSTING_INVALID);
        }

        long total = 0;
        for (WalletPostingLeg leg : legs) {
            if (leg.account() == null || leg.amount() == 0) throw new AppException(ErrorCode.WALLET_POSTING_INVALID);

            WalletPostingType type = command.getPostingType();
            boolean allowed = leg.amount() < 0
                    ? type.getDebitTypes().contains(leg.account().type())
                    : type.getCreditTypes().contains(leg.account().type());
            if (!allowed) throw new AppException(ErrorCode.WALLET_POSTING_INVALID);

            try {
                leg.account().ownerKey();
                total = Math.addExact(total, leg.amount());
            } catch (IllegalArgumentException | ArithmeticException e) {
                throw new AppException(ErrorCode.WALLET_POSTING_INVALID);
            }
        }

        //but toan kep: tong cac dong phai bang 0, tien khong tu sinh ra hay mat di
        if (total != 0) throw new AppException(ErrorCode.WALLET_POSTING_INVALID);
    }

    private void assertBalanceAllowed(WalletPostingType postingType, WalletPostingLeg leg, long balanceAfter) {

        //cong tien (tra bot no) luon duoc, chi chan dong tru lam so du am
        if (balanceAfter >= 0 || leg.amount() > 0) return;

        WalletAccountType accountType = leg.account().type();

        if (accountType == WalletAccountType.EXTERNAL_CLEARING) return;
        if (accountType == WalletAccountType.USER_AVAILABLE && postingType.isAllowNegativeAvailable()) return;

        throw new AppException(ErrorCode.WALLET_INSUFFICIENT_FUNDS);
    }

    private Optional<WalletPostingResult> replayIfPosted(String idempotencyKey, String payloadHash) {

        return walletTransactionRepository.findByIdempotencyKey(idempotencyKey).map(existing -> {
            if (!existing.getPayloadHash().equals(payloadHash)) {
                throw new AppException(ErrorCode.WALLET_IDEMPOTENCY_CONFLICT);
            }
            return toResult(existing, true);
        });
    }

    private UUID ensureAccount(WalletAccountRef ref) {

        try {
            return walletAccountProvisioner.ensure(ref);
        } catch (DataIntegrityViolationException e) {
            return walletAccountProvisioner.ensure(ref);
        }
    }

    private String payloadHash(WalletPostingCommand command) {

        String legs = command.getLegs().stream()
                .map(leg -> leg.account().type() + ":" + leg.account().ownerKey() + ":" + leg.amount())
                .sorted()
                .collect(Collectors.joining(";"));
        String payload = command.getPostingType() + "|" + command.getObligationId() + "|" + legs;

        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }

    private WalletPostingResult toResult(WalletTransaction transaction, boolean replayed) {

        return new WalletPostingResult(transaction.getWalletTransactionId(), replayed,
                transaction.getEntries().stream()
                        .map(entry -> new WalletPostingResult.Entry(
                                entry.getAccount().getWalletAccountId(),
                                entry.getAccount().getAccountType(),
                                entry.getAccount().getOwnerKey(),
                                entry.getAmount(),
                                entry.getBalanceAfter()))
                        .toList());
    }
}
