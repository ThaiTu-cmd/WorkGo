package com.workgo.identity.dto;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {
    int totalPages;
    int pageSize;
    long totalElements;
    int currentPage;

    List<T> data;


}
