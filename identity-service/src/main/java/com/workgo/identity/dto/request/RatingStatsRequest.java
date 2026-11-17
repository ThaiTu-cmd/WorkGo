package com.workgo.identity.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

//review-service tinh san gia tri tong, gui de ghi de
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
