package com.workgo.job.dto.response.client;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** Existing Identity contract; accepting orders is not account active status. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProviderProfileResponse {
    private UUID providerProfileId;
    private UUID userId;
    private String userStatus;
    private String providerType;
    private String businessName;
    private String bio;
    private String verificationStatus;
    private double ratingAvg;
    private long ratingCount;
    private int completedOrderCount;
    @JsonAlias("isAcceptingOrders")
    private boolean acceptingOrders;
    private Instant joinedAt;
}
