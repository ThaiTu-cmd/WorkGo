package com.workgo.identity.dto.response;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressResponse {

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
