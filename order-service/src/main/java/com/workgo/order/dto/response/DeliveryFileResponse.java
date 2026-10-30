package com.workgo.order.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeliveryFileResponse {

    UUID deliveryFileId;

    String fileUrl;

    String fileName;

    String mimeType;

    Long sizeBytes;

    String fileHash;

}
