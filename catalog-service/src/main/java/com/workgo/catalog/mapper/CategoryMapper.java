package com.workgo.catalog.mapper;

import com.workgo.catalog.dto.request.CategoryUpdateRequest;
import com.workgo.catalog.dto.response.CategoryCreationResponse;
import com.workgo.catalog.dto.response.CategoryResponse;
import com.workgo.catalog.dto.response.CategorySecondResponse;
import com.workgo.catalog.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "parent", source = "parent.categoryId")
    CategoryCreationResponse toCategoryCreationResponse(Category category);

    @Mapping(target = "parent", source = "parent.categoryId")
    CategoryResponse toCategoryResponse(Category category);

    CategorySecondResponse toCategorySecondResponse(Category category);

    @Mapping(target = "parent",ignore = true)
    void updateCategory(@MappingTarget Category category, CategoryUpdateRequest request);

}
