package com.workgo.catalog.repository;

import com.workgo.catalog.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    boolean existsBySlug(String slug);

    Page<Category> findAll(Pageable pageable);

    Page<Category> findAllByParentIsNull(Pageable pageable);

    Page<Category> findAllByParent_CategoryId(UUID parentId, Pageable pageable);

}
