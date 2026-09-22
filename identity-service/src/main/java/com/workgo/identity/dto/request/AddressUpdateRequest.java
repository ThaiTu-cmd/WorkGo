package com.workgo.identity.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressUpdateRequest {

    String label;

    String contactName;

    String contactPhone;

    String line1;

    String ward;

    String district;

    String city;

    String countryCode;

    String latitude;

    String longitude;

    String note;

}
