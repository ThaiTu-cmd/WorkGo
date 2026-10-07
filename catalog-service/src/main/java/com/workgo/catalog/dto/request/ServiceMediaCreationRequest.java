package com.workgo.catalog.dto.request;

import com.workgo.catalog.enumeration.MediaType;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ServiceMediaCreationRequest {

    String url;

    MediaType mediaType;

    boolean cover;

}
