package com.ureport.admin.service;

import com.ureport.admin.dto.CategoryGroupDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.CategoryGroup;
import com.ureport.repository.CategoryGroupRepository;
import com.ureport.repository.CategoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD service for CategoryGroup management.
 *
 * Delete safety: refuses to delete a group if any category references it.
 */
@Service
@Transactional
public class CategoryGroupService {

    private final CategoryGroupRepository categoryGroupRepository;
    private final CategoryRepository categoryRepository;

    public CategoryGroupService(CategoryGroupRepository categoryGroupRepository,
                                CategoryRepository categoryRepository) {
        this.categoryGroupRepository = categoryGroupRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryGroupDto> listCategoryGroups() {
        return categoryGroupRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CategoryGroupDto createGroup(CreateCategoryGroupRequest req) {
        CategoryGroup group = new CategoryGroup();
        group.setName(req.name());
        group.setOrdering(req.ordering());
        group = categoryGroupRepository.save(group);
        return toDto(group);
    }

    public CategoryGroupDto updateGroup(Long id, CreateCategoryGroupRequest req) {
        CategoryGroup group = findGroupOrThrow(id);
        group.setName(req.name());
        group.setOrdering(req.ordering());
        group = categoryGroupRepository.save(group);
        return toDto(group);
    }

    public void deleteGroup(Long id) {
        CategoryGroup group = findGroupOrThrow(id);

        // Delete safety: refuse if categories reference this group
        if (categoryRepository.existsByCategoryGroupId(id)) {
            throw new BusinessException("CATEGORY_GROUP_IN_USE",
                    "Category group has categories and cannot be deleted",
                    HttpStatus.CONFLICT);
        }

        categoryGroupRepository.delete(group);
    }

    private CategoryGroup findGroupOrThrow(Long id) {
        return categoryGroupRepository.findById(id)
                .orElseThrow(() -> new BusinessException("CATEGORY_GROUP_NOT_FOUND",
                        "Category group not found: " + id, HttpStatus.NOT_FOUND));
    }

    private CategoryGroupDto toDto(CategoryGroup g) {
        return new CategoryGroupDto(g.getId(), g.getName(), g.getOrdering());
    }

    /** Simple request record for create/update category group. */
    public record CreateCategoryGroupRequest(String name, Short ordering) {}
}
