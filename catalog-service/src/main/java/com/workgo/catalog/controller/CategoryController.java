package com.workgo.catalog.controller;

import com.workgo.catalog.dto.ApiResponse;
import com.workgo.catalog.dto.PageResponse;
import com.workgo.catalog.dto.request.CategoryCreationRequest;
import com.workgo.catalog.dto.request.CategoryUpdateRequest;
import com.workgo.catalog.dto.response.CategoryCreationResponse;
import com.workgo.catalog.dto.response.CategoryResponse;
import com.workgo.catalog.entity.Category;
import com.workgo.catalog.exception.ErrorCode;
import com.workgo.catalog.service.CategoryService;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@RequestMapping("/categories")
public class CategoryController {

    CategoryService categoryService;

    @PostMapping
    ApiResponse<CategoryCreationResponse> createCategory(
            @RequestBody CategoryCreationRequest request
            ){
        return ApiResponse.<CategoryCreationResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(categoryService.createCategory(request))
                .build();
    }

    //Lay category theo Id
    @GetMapping("/{categoryId}")
    ApiResponse<CategoryResponse> getCategory(
            @PathVariable UUID categoryId
            ){
        return ApiResponse.<CategoryResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(categoryService.getCategory(categoryId))
                .build();
    }

    //Lay tat ca category
    @GetMapping
    ApiResponse<PageResponse<CategoryResponse>> getAllCategory(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ){
        return ApiResponse.<PageResponse<CategoryResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(categoryService.getAllCategory(page, size))
                .build();
    }


    //Lay tat ca category goc
    @GetMapping("/roots")
    ApiResponse<PageResponse<CategoryResponse>> getAllRootCategory(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ){
        return ApiResponse.<PageResponse<CategoryResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(categoryService.getAllRootCategory(page, size))
                .build();
    }

    //Lay danh sach con cua mot category cha
    @GetMapping("/{parentId}/children")
    ApiResponse<PageResponse<CategoryResponse>> getAllByParent(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @PathVariable UUID parentId
    ){
        return ApiResponse.<PageResponse<CategoryResponse>>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(categoryService.getAllByParent(parentId, page, size))
                .build();
    }

    @PutMapping("/{categoryId}")
    ApiResponse<CategoryResponse> updateCategory(
            @PathVariable UUID categoryId,
            @RequestBody CategoryUpdateRequest request
            ){
        return ApiResponse.<CategoryResponse>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .result(categoryService.updateCategory(categoryId, request))
                .build();
    }

    @DeleteMapping("/{categoryId}")
    ApiResponse<Void> deleteCategory(
            @PathVariable UUID categoryId
    ){
        categoryService.deleteCategory(categoryId);

        return ApiResponse.<Void>builder()
                .code(ErrorCode.SUCCESS.getCode())
                .message(ErrorCode.SUCCESS.getMessage())
                .build();
    }

}
