package com.workgo.payment.dto.response.client;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProviderProfileResponse {

    UUID providerProfileId;

    UUID userId;

}
