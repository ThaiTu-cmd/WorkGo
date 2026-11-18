package com.workgo.identity.Mapper;

import com.workgo.identity.dto.response.VerificationDocumentResponse;
import com.workgo.identity.entity.VerificationDocument;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface VerificationDocumentMapper {

    VerificationDocumentResponse toVerificationDocumentResponse(VerificationDocument verificationDocument);
}
