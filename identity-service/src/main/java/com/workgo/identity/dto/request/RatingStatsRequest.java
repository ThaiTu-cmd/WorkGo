package com.workgo.identity.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RatingStatsRequest {

    Double ratingAvg;

    Long ratingCount;

    Long aggregateVersion;

}
