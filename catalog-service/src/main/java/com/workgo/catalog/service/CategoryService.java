package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.CategoryCreationRequest;
import com.workgo.catalog.dto.request.CategoryUpdateRequest;
import com.workgo.catalog.dto.response.CategoryCreationResponse;
import com.workgo.catalog.dto.response.CategoryResponse;
import com.workgo.catalog.entity.Category;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.mapper.CategoryMapper;
import com.workgo.catalog.repository.CategoryRepository;
import com.workgo.catalog.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.aspectj.apache.bcel.classfile.AttributeUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CategoryService {

    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;

    public CategoryCreationResponse createCategory(CategoryCreationRequest request){

        if(categoryRepository.existsBySlug(request.getSlug())){
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }

        Jwt jwt = (Jwt) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();

        UUID currentUserId = UUID.fromString(jwt.getClaimAsString("userId"));

        Category parentCategory = null;
        if(request.getParent() != null){
            parentCategory = categoryRepository.findById(request.getParent())
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_CATEGORY_NOT_EXISTED));
        }

        Category category = Category.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .createdAt(Instant.now())
                .createdBy(currentUserId)
                .updatedAt(Instant.now())
                .updatedBy(currentUserId)
                .parent(parentCategory)
                .build();

        parentCategory.getChildren().add(category);
        if(parentCategory != null){
            categoryRepository.save(parentCategory);
        }


        Category savedCategory = categoryRepository.save(category);

        return categoryMapper.toCategoryCreationResponse(savedCategory);

    }

    public CategoryResponse getCategory(UUID id){

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        return categoryMapper.toCategoryResponse(category);

    }

    public PageResponse<CategoryResponse> getAllCategory(int page, int size){

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = categoryRepository.findAll(pageable);

        return PageResponse.<CategoryResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .data(pageData.stream()
                        .map(categoryMapper :: toCategoryResponse)
                        .toList())
                .build();

    }

    public PageResponse<CategoryResponse> getAllRootCategory(int page, int size){
        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = categoryRepository.findAllByParentIsNull(pageable);

        return PageResponse.<CategoryResponse>builder()
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .pageSize(pageData.getSize())
                .currentPage(page)
                .data(pageData.stream()
                        .map(categoryMapper :: toCategoryResponse)
                        .toList())
                .build();

    }

    public PageResponse<CategoryResponse> getAllByParent(UUID parentId, int page, int size){
        if(!categoryRepository.existsById(parentId)){
            throw new AppException(ErrorCode.CATEGORY_NOT_EXISTED);
        }

        Sort sort = Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        var pageData = categoryRepository.findAllByParent_CategoryId(parentId,pageable);

        return PageResponse.<CategoryResponse>builder()
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .pageSize(pageData.getSize())
                .currentPage(page)
                .data(pageData.stream()
                        .map(categoryMapper :: toCategoryResponse)
                        .toList())
                .build();

    }

    public CategoryResponse updateCategory(UUID id, CategoryUpdateRequest request){
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));


        if(request.getParent() != null){
           Category parent = categoryRepository.findById(request.getParent())
                   .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

            category.setParent(parent);

            parent.getChildren().add(category);
            categoryRepository.save(parent);
        }
        else category.setParent(null);

        categoryMapper.updateCategory(category, request);

        Category savedCategory = categoryRepository.save(category);

        return categoryMapper.toCategoryResponse(savedCategory);
    }

    public void deleteCategory(UUID id){
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

       int mark = Instant.now().getNano() * 1000;

       category.setIsDeleted(mark);
       categoryRepository.save(category);

    }


}
