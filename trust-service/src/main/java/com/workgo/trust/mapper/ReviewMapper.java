package com.workgo.trust.mapper;

import com.workgo.trust.entity.Review;
import com.workgo.trust.dto.response.ReviewDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ReviewMapper {
    @Mapping(target = "isPublished", source = "published")
    ReviewDto toDto(Review entity);
}
