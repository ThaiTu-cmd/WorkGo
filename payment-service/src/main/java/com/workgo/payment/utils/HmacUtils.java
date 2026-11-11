package com.workgo.payment.utils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;

public class HmacUtils {

    private HmacUtils() {
    }

    //vnpay ky bang HmacSHA512, tra hex chu thuong
    public static String hmacSha512(String key, String data) {
        return hmac("HmacSHA512", key, data);
    }

    //momo ky bang HmacSHA256
    public static String hmacSha256(String key, String data) {
        return hmac("HmacSHA256", key, data);
    }

    private static String hmac(String algorithm, String key, String data) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), algorithm));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Cannot sign with " + algorithm, e);
        }
    }

}
