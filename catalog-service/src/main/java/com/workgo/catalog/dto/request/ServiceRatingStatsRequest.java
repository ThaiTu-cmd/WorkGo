package com.workgo.catalog.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

//review-service tinh san gia tri tong, gui de ghi de
@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceRatingStatsRequest {

    Double avgRating;

    Long reviewCount;

}
