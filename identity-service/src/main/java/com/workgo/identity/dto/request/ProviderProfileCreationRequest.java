package com.workgo.identity.dto.request;

import com.workgo.identity.enumeration.ProviderType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProviderProfileCreationRequest {

    ProviderType providerType;

    String businessName;

    String bio;

}
