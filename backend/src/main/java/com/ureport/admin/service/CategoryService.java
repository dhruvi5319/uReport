package com.ureport.admin.service;

import com.ureport.admin.dto.*;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.*;
import com.ureport.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * CRUD service for Category management (F8).
 *
 * Security mitigations (threat model):
 * - T-05-12: @PreAuthorize(ADMIN) enforced in CategoryController for all write methods
 * - T-05-14: actionResponses reconciliation scoped to this category's collection only
 * - T-05-15: validatePermissionLevels() enforces posting ≥ permissive as display
 */
@Service
@Transactional
public class CategoryService {

    /**
     * Permissiveness order: anonymous (0) > public (1) > staff (2).
     * postingPermissionLevel permissiveness must be ≥ displayPermissionLevel permissiveness.
     * Lower PERM_ORDER value = more permissive.
     */
    private static final Map<String, Integer> PERM_ORDER = Map.of(
            "anonymous", 0,
            "public", 1,
            "staff", 2
    );

    private final CategoryRepository categoryRepository;
    private final CategoryGroupRepository categoryGroupRepository;
    private final DepartmentRepository departmentRepository;
    private final PersonRepository personRepository;
    private final ActionsRepository actionsRepository;
    private final TicketRepository ticketRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           CategoryGroupRepository categoryGroupRepository,
                           DepartmentRepository departmentRepository,
                           PersonRepository personRepository,
                           ActionsRepository actionsRepository,
                           TicketRepository ticketRepository) {
        this.categoryRepository = categoryRepository;
        this.categoryGroupRepository = categoryGroupRepository;
        this.departmentRepository = departmentRepository;
        this.personRepository = personRepository;
        this.actionsRepository = actionsRepository;
        this.ticketRepository = ticketRepository;
    }

    // -----------------------------------------------------------------------
    // LIST
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CategoryListItemDto> listCategories(Long groupId, Long departmentId, Boolean active) {
        return categoryRepository.findFiltered(groupId, departmentId, active)
                .stream()
                .map(this::toListItemDto)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    public CategoryDetailDto createCategory(CreateCategoryRequest req) {
        // Validate department exists (T-05-14)
        Department department = departmentRepository.findById(req.departmentId)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found: " + req.departmentId, HttpStatus.NOT_FOUND));

        // Validate permission levels (T-05-15)
        validatePermissionLevels(req.displayPermissionLevel, req.postingPermissionLevel);

        // Validate autoClose rule
        if (req.autoCloseIsActive && req.autoCloseSubstatusId == null) {
            throw new BusinessException("AUTOCLOSE_SUBSTATUS_REQUIRED",
                    "autoCloseSubstatusId is required when autoCloseIsActive is true",
                    HttpStatus.BAD_REQUEST);
        }

        // Load optional associations
        Person defaultPerson = resolveOptionalPerson(req.defaultPersonId);
        CategoryGroup categoryGroup = resolveOptionalCategoryGroup(req.categoryGroupId);

        Category category = new Category();
        category.setName(req.name);
        category.setDescription(req.description);
        category.setDepartment(department);
        category.setDefaultPerson(defaultPerson);
        category.setCategoryGroup(categoryGroup);
        category.setActive(req.active);
        category.setFeatured(req.featured);
        category.setDisplayPermissionLevel(req.displayPermissionLevel);
        category.setPostingPermissionLevel(req.postingPermissionLevel);
        category.setSlaDays(req.slaDays);
        category.setNotificationReplyEmail(req.notificationReplyEmail);
        category.setAutoCloseIsActive(req.autoCloseIsActive);
        category.setAutoCloseSubstatusId(req.autoCloseSubstatusId);

        // Populate actionResponses collection
        if (req.actionResponses != null) {
            for (CategoryActionResponseDto dto : req.actionResponses) {
                CategoryActionResponse car = new CategoryActionResponse();
                car.setActionId(dto.actionId());
                car.setTemplate(dto.template());
                car.setReplyEmail(dto.replyEmail());
                category.getCategoryActionResponses().add(car);
            }
        }

        category = categoryRepository.save(category);
        return toDetailDto(category);
    }

    // -----------------------------------------------------------------------
    // GET
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public CategoryDetailDto getCategory(Long id) {
        Category category = findCategoryOrThrow(id);
        return toDetailDto(category);
    }

    // -----------------------------------------------------------------------
    // UPDATE
    // -----------------------------------------------------------------------

    public CategoryDetailDto updateCategory(Long id, UpdateCategoryRequest req) {
        Category category = findCategoryOrThrow(id);

        // Validate department exists
        Department department = departmentRepository.findById(req.departmentId)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found: " + req.departmentId, HttpStatus.NOT_FOUND));

        // Validate permission levels
        validatePermissionLevels(req.displayPermissionLevel, req.postingPermissionLevel);

        // Validate autoClose rule
        if (req.autoCloseIsActive && req.autoCloseSubstatusId == null) {
            throw new BusinessException("AUTOCLOSE_SUBSTATUS_REQUIRED",
                    "autoCloseSubstatusId is required when autoCloseIsActive is true",
                    HttpStatus.BAD_REQUEST);
        }

        // Load optional associations
        Person defaultPerson = resolveOptionalPerson(req.defaultPersonId);
        CategoryGroup categoryGroup = resolveOptionalCategoryGroup(req.categoryGroupId);

        // Update scalar fields
        category.setName(req.name);
        category.setDescription(req.description);
        category.setDepartment(department);
        category.setDefaultPerson(defaultPerson);
        category.setCategoryGroup(categoryGroup);
        category.setActive(req.active);
        category.setFeatured(req.featured);
        category.setDisplayPermissionLevel(req.displayPermissionLevel);
        category.setPostingPermissionLevel(req.postingPermissionLevel);
        category.setSlaDays(req.slaDays);
        category.setNotificationReplyEmail(req.notificationReplyEmail);
        category.setAutoCloseIsActive(req.autoCloseIsActive);
        category.setAutoCloseSubstatusId(req.autoCloseSubstatusId);

        // actionResponses reconciliation (T-05-14):
        // Build a map of existing entries by id for efficient lookup
        List<CategoryActionResponse> existingList = category.getCategoryActionResponses();

        // Build index of existing entries by id
        Map<Long, CategoryActionResponse> existingById = existingList.stream()
                .filter(car -> car.getId() != null)
                .collect(Collectors.toMap(CategoryActionResponse::getId, car -> car));

        // Collect updated entries to keep/add
        List<CategoryActionResponse> updatedList = new ArrayList<>();
        if (req.actionResponses != null) {
            for (CategoryActionResponseDto dto : req.actionResponses) {
                if (dto.id() != null && existingById.containsKey(dto.id())) {
                    // Update existing entry
                    CategoryActionResponse existing = existingById.get(dto.id());
                    existing.setActionId(dto.actionId());
                    existing.setTemplate(dto.template());
                    existing.setReplyEmail(dto.replyEmail());
                    updatedList.add(existing);
                } else {
                    // New entry (id is null or doesn't exist in this category)
                    CategoryActionResponse car = new CategoryActionResponse();
                    car.setActionId(dto.actionId());
                    car.setTemplate(dto.template());
                    car.setReplyEmail(dto.replyEmail());
                    updatedList.add(car);
                }
            }
        }

        // Replace the collection — orphanRemoval will delete removed entries
        existingList.clear();
        existingList.addAll(updatedList);

        category = categoryRepository.save(category);
        return toDetailDto(category);
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    public void deleteCategory(Long id) {
        Category category = findCategoryOrThrow(id);

        // Delete safety: refuse if any ticket references this category
        if (ticketRepository.existsByCategoryId(id)) {
            throw new BusinessException("CATEGORY_IN_USE",
                    "Category is referenced by tickets and cannot be deleted",
                    HttpStatus.CONFLICT);
        }

        categoryRepository.delete(category);
    }

    // -----------------------------------------------------------------------
    // GET ACTION RESPONSE
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public CategoryActionResponseDto getActionResponse(Long categoryId, Long actionId) {
        Category category = findCategoryOrThrow(categoryId);

        // First: look for category-specific override
        for (CategoryActionResponse car : category.getCategoryActionResponses()) {
            if (actionId.equals(car.getActionId())) {
                return new CategoryActionResponseDto(car.getId(), car.getActionId(),
                        car.getTemplate(), car.getReplyEmail());
            }
        }

        // Fallback: use the action's default template
        Action action = actionsRepository.findById(actionId)
                .orElseThrow(() -> new BusinessException("ACTION_NOT_FOUND",
                        "Action not found: " + actionId, HttpStatus.NOT_FOUND));

        return new CategoryActionResponseDto(null, action.getId(),
                action.getTemplate(), action.getReplyEmail());
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND",
                        "Category not found: " + id, HttpStatus.NOT_FOUND));
    }

    private Person resolveOptionalPerson(Long personId) {
        if (personId == null) return null;
        return personRepository.findById(personId)
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found: " + personId, HttpStatus.NOT_FOUND));
    }

    private CategoryGroup resolveOptionalCategoryGroup(Long groupId) {
        if (groupId == null) return null;
        return categoryGroupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessException("CATEGORY_GROUP_NOT_FOUND",
                        "Category group not found: " + groupId, HttpStatus.NOT_FOUND));
    }

    /**
     * Validates that postingPermissionLevel is not more restrictive than displayPermissionLevel.
     * Permissiveness order: anonymous (0) > public (1) > staff (2).
     * posting PERM_ORDER must be ≤ display PERM_ORDER (more or equally permissive).
     *
     * Example: display=public(1), posting=staff(2) → invalid (staff is more restrictive)
     * Example: display=public(1), posting=public(1) → valid
     * Example: display=public(1), posting=anonymous(0) → valid (anonymous is more permissive)
     */
    private void validatePermissionLevels(String display, String posting) {
        Integer displayOrder = PERM_ORDER.get(display);
        Integer postingOrder = PERM_ORDER.get(posting);

        if (displayOrder == null) {
            throw new BusinessException("INVALID_INPUT",
                    "Invalid displayPermissionLevel: " + display, HttpStatus.BAD_REQUEST);
        }
        if (postingOrder == null) {
            throw new BusinessException("INVALID_INPUT",
                    "Invalid postingPermissionLevel: " + posting, HttpStatus.BAD_REQUEST);
        }

        // posting must be ≤ restrictive as display — i.e., posting permissiveness ≥ display permissiveness
        // In PERM_ORDER: lower number = more permissive. posting ≤ display in PERM_ORDER means more permissive.
        // Violation: posting > display (posting is MORE restrictive than display)
        if (postingOrder > displayOrder) {
            throw new BusinessException("PERMISSION_LEVEL_INVALID",
                    "postingPermissionLevel cannot be more restrictive than displayPermissionLevel",
                    HttpStatus.BAD_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // Mapping helpers
    // -----------------------------------------------------------------------

    public CategoryListItemDto toListItemDto(Category c) {
        CategoryListItemDto dto = new CategoryListItemDto();
        dto.id = c.getId();
        dto.name = c.getName();
        dto.active = Boolean.TRUE.equals(c.getActive());
        dto.featured = Boolean.TRUE.equals(c.getFeatured());
        if (c.getDepartment() != null) {
            dto.department = new CategoryDetailDto.DepartmentRef(
                    c.getDepartment().getId(), c.getDepartment().getName());
        }
        if (c.getCategoryGroup() != null) {
            dto.categoryGroup = new CategoryDetailDto.CategoryGroupRef(
                    c.getCategoryGroup().getId(), c.getCategoryGroup().getName());
        }
        return dto;
    }

    CategoryDetailDto toDetailDto(Category c) {
        CategoryDetailDto dto = new CategoryDetailDto();
        dto.id = c.getId();
        dto.name = c.getName();
        dto.description = c.getDescription();
        dto.active = Boolean.TRUE.equals(c.getActive());
        dto.featured = Boolean.TRUE.equals(c.getFeatured());
        dto.displayPermissionLevel = c.getDisplayPermissionLevel();
        dto.postingPermissionLevel = c.getPostingPermissionLevel();
        dto.slaDays = c.getSlaDays();
        dto.notificationReplyEmail = c.getNotificationReplyEmail();
        dto.autoCloseIsActive = Boolean.TRUE.equals(c.getAutoCloseIsActive());
        dto.autoCloseSubstatusId = c.getAutoCloseSubstatusId();

        if (c.getDepartment() != null) {
            dto.department = new CategoryDetailDto.DepartmentRef(
                    c.getDepartment().getId(), c.getDepartment().getName());
        }
        if (c.getDefaultPerson() != null) {
            Person p = c.getDefaultPerson();
            dto.defaultPerson = new CategoryDetailDto.PersonRef(
                    p.getId(), p.getFirstname(), p.getLastname());
        }
        if (c.getCategoryGroup() != null) {
            dto.categoryGroup = new CategoryDetailDto.CategoryGroupRef(
                    c.getCategoryGroup().getId(), c.getCategoryGroup().getName());
        }

        dto.actionResponses = c.getCategoryActionResponses().stream()
                .map(car -> new CategoryActionResponseDto(
                        car.getId(), car.getActionId(), car.getTemplate(), car.getReplyEmail()))
                .collect(Collectors.toList());

        return dto;
    }
}
