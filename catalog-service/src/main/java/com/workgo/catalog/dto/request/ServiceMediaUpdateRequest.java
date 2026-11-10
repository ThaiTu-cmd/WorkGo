package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.MediaType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceMediaUpdateRequest {

    String url;

    MediaType mediaType;

    boolean cover;

}
