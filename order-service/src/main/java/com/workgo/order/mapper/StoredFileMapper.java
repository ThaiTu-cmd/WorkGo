package com.workgo.order.mapper;

import com.workgo.order.dto.response.StoredFileResponse;
import com.workgo.order.entity.StoredFile;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface StoredFileMapper {

    StoredFileResponse toStoredFileResponse(StoredFile storedFile);
}
