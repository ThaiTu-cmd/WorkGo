package com.workgo.order.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeliveryFileRequest {

    String fileUrl;

    String fileName;

    String mimeType;

    Long sizeBytes;

    String fileHash;

}
