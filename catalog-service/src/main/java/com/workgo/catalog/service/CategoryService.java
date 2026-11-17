package com.workgo.catalog.service;

import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.CategoryCreationRequest;
import com.workgo.catalog.dto.request.CategoryUpdateRequest;
import com.workgo.catalog.dto.response.CategoryCreationResponse;
import com.workgo.catalog.dto.response.CategoryResponse;
import com.workgo.catalog.entity.Category;
import com.workgo.catalog.enumeration.AdminActionType;
import com.workgo.catalog.exception.AppException;
import com.workgo.catalog.mapper.CategoryMapper;
import com.workgo.catalog.repository.CategoryRepository;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.admin.AdminAction;
import com.workgo.catalog.service.admin.AdminAuditService;
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
import org.springframework.transaction.annotation.Transactional;

import com.workgo.catalog.utils.TokenUtils;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CategoryService {

    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    TokenUtils tokenUtils;
    AdminAuditService adminAuditService;

    @Transactional
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

        // The child owns the parent_id column, so saving it once is enough;
        // saving the parent too would cascade a second insert of this child.
        Category savedCategory = categoryRepository.save(category);
        if(parentCategory != null){
            parentCategory.getChildren().add(savedCategory);
        }

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.CATEGORY_CREATED)
                .targetType("CATEGORY")
                .targetId(savedCategory.getCategoryId())
                .afterState(categoryState(savedCategory))
                .build());

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

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryUpdateRequest request){
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        Map<String, Object> beforeState = categoryState(category);


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

        adminAuditService.record(AdminAction.builder()
                .action(AdminActionType.CATEGORY_UPDATED)
                .targetType("CATEGORY")
                .targetId(id)
                .beforeState(beforeState)
                .afterState(categoryState(savedCategory))
                .build());

        return categoryMapper.toCategoryResponse(savedCategory);
    }

    @Transactional
    public void deleteCategory(UUID id){
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

       Map<String, Object> beforeState = categoryState(category);

       category.setIsDeleted(tokenUtils.createDeletedMark());
       categoryRepository.save(category);

       adminAuditService.record(AdminAction.builder()
               .action(AdminActionType.CATEGORY_DELETED)
               .targetType("CATEGORY")
               .targetId(id)
               .beforeState(beforeState)
               .afterState(Map.of("deleted", true))
               .build());

    }

    //=====================================

    private Map<String, Object> categoryState(Category category){
        Map<String, Object> state = new LinkedHashMap<>();

        state.put("name", category.getName());
        state.put("slug", category.getSlug());
        state.put("parentId", category.getParent() == null ? null : category.getParent().getCategoryId());

        return state;
    }
}
