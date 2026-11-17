package com.workgo.catalog.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceRatingStatsRequest {

    Double avgRating;

    Long reviewCount;

    Long aggregateVersion;

}
