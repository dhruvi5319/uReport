package com.ureport.service;

import com.ureport.dto.request.CategoryActionResponseRequest;
import com.ureport.dto.request.CreateCategoryGroupRequest;
import com.ureport.dto.request.CreateCategoryRequest;
import com.ureport.dto.request.ReorderGroupsRequest;
import com.ureport.dto.response.CategoryGroupResponse;
import com.ureport.dto.response.CategoryResponse;
import com.ureport.entity.Action;
import com.ureport.entity.Category;
import com.ureport.entity.CategoryActionResponse;
import com.ureport.entity.CategoryGroup;
import com.ureport.entity.Department;
import com.ureport.entity.Person;
import com.ureport.entity.Substatus;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.ActionRepository;
import com.ureport.repository.CategoryActionResponseRepository;
import com.ureport.repository.CategoryGroupRepository;
import com.ureport.repository.CategoryRepository;
import com.ureport.repository.DepartmentRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.SubstatusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {

    private static final Set<String> VALID_PERMISSION_LEVELS = Set.of("staff", "public", "anonymous");

    private final CategoryRepository categoryRepository;
    private final CategoryGroupRepository categoryGroupRepository;
    private final CategoryActionResponseRepository carRepository;
    private final DepartmentRepository departmentRepository;
    private final PersonRepository personRepository;
    private final SubstatusRepository substatusRepository;
    private final ActionRepository actionRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           CategoryGroupRepository categoryGroupRepository,
                           CategoryActionResponseRepository carRepository,
                           DepartmentRepository departmentRepository,
                           PersonRepository personRepository,
                           SubstatusRepository substatusRepository,
                           ActionRepository actionRepository) {
        this.categoryRepository = categoryRepository;
        this.categoryGroupRepository = categoryGroupRepository;
        this.carRepository = carRepository;
        this.departmentRepository = departmentRepository;
        this.personRepository = personRepository;
        this.substatusRepository = substatusRepository;
        this.actionRepository = actionRepository;
    }

    // ---- Category CRUD ----

    public CategoryResponse createCategory(CreateCategoryRequest req) {
        if (req.getDisplayPermissionLevel() != null) {
            validatePermissionLevel(req.getDisplayPermissionLevel());
        }
        if (req.getPostingPermissionLevel() != null) {
            validatePermissionLevel(req.getPostingPermissionLevel());
        }

        Category cat = new Category();
        mapRequestToCategory(req, cat);
        cat = categoryRepository.save(cat);
        return toResponse(cat);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Integer id) {
        return toResponse(loadCategory(id));
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories(String callerRole) {
        List<Category> categories;
        if ("staff".equalsIgnoreCase(callerRole)) {
            // Staff sees all active categories
            categories = categoryRepository.findByActiveTrue();
        } else if ("public".equalsIgnoreCase(callerRole)) {
            // Public sees public + anonymous
            categories = categoryRepository.findByActiveTrue().stream()
                    .filter(c -> "public".equals(c.getDisplayPermissionLevel())
                            || "anonymous".equals(c.getDisplayPermissionLevel()))
                    .collect(Collectors.toList());
        } else {
            // Anonymous sees only anonymous
            categories = categoryRepository.findByActiveTrue().stream()
                    .filter(c -> "anonymous".equals(c.getDisplayPermissionLevel()))
                    .collect(Collectors.toList());
        }
        return categories.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CategoryResponse updateCategory(Integer id, CreateCategoryRequest req) {
        Category cat = loadCategory(id);
        if (req.getDisplayPermissionLevel() != null) {
            validatePermissionLevel(req.getDisplayPermissionLevel());
        }
        if (req.getPostingPermissionLevel() != null) {
            validatePermissionLevel(req.getPostingPermissionLevel());
        }
        mapRequestToCategory(req, cat);
        cat = categoryRepository.save(cat);
        return toResponse(cat);
    }

    public void deleteCategory(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new NotFoundException("CATEGORY_NOT_FOUND", "Category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }

    // ---- CategoryGroup CRUD ----

    public CategoryGroupResponse createCategoryGroup(CreateCategoryGroupRequest req) {
        CategoryGroup group = new CategoryGroup();
        group.setName(req.getName());
        group.setOrdering(req.getOrdering() != null ? req.getOrdering() : 0);
        group = categoryGroupRepository.save(group);
        return toGroupResponse(group);
    }

    @Transactional(readOnly = true)
    public CategoryGroupResponse getCategoryGroup(Integer id) {
        CategoryGroup group = loadCategoryGroup(id);
        return toGroupResponseWithCategories(group);
    }

    @Transactional(readOnly = true)
    public List<CategoryGroupResponse> listCategoryGroups() {
        return categoryGroupRepository.findAllByOrderByOrderingAsc().stream()
                .map(this::toGroupResponse)
                .collect(Collectors.toList());
    }

    public CategoryGroupResponse updateCategoryGroup(Integer id, CreateCategoryGroupRequest req) {
        CategoryGroup group = loadCategoryGroup(id);
        if (req.getName() != null) group.setName(req.getName());
        if (req.getOrdering() != null) group.setOrdering(req.getOrdering());
        group = categoryGroupRepository.save(group);
        return toGroupResponse(group);
    }

    public void deleteCategoryGroup(Integer id) {
        if (!categoryGroupRepository.existsById(id)) {
            throw new NotFoundException("CATEGORY_GROUP_NOT_FOUND", "Category group not found: " + id);
        }
        categoryGroupRepository.deleteById(id);
    }

    public void reorderGroups(ReorderGroupsRequest req) {
        if (req.getGroups() == null) return;
        for (ReorderGroupsRequest.GroupOrder order : req.getGroups()) {
            CategoryGroup group = loadCategoryGroup(order.getId());
            group.setOrdering(order.getOrdering());
            categoryGroupRepository.save(group);
        }
    }

    // ---- CategoryActionResponse management ----

    /**
     * Upserts a CategoryActionResponse for a category+action pair.
     * If a record with this category_id+action_id exists, update it.
     * If not, create a new one.
     */
    public CategoryResponse upsertCategoryActionResponse(Integer categoryId, Integer actionId,
                                                          String template, String replyEmail) {
        Category category = loadCategory(categoryId);
        Action action = actionRepository.findById(actionId)
                .orElseThrow(() -> new NotFoundException("ACTION_NOT_FOUND",
                        "Action not found: " + actionId));

        Optional<CategoryActionResponse> existing = carRepository.findByCategoryIdAndActionId(categoryId, actionId);
        CategoryActionResponse car;
        if (existing.isPresent()) {
            car = existing.get();
            car.setTemplate(template);
            car.setReplyEmail(replyEmail);
        } else {
            car = new CategoryActionResponse();
            car.setCategory(category);
            car.setAction(action);
            car.setTemplate(template);
            car.setReplyEmail(replyEmail);
        }
        carRepository.save(car);

        return toResponse(categoryRepository.findById(categoryId).orElseThrow());
    }

    public void deleteCategoryActionResponse(Integer responseId) {
        if (!carRepository.existsById(responseId)) {
            throw new NotFoundException("ACTION_RESPONSE_NOT_FOUND",
                    "Action response not found: " + responseId);
        }
        carRepository.deleteById(responseId);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse.CategoryActionResponseDTO> listCategoryActionResponses(Integer categoryId) {
        loadCategory(categoryId); // ensure exists
        return carRepository.findByCategoryId(categoryId).stream()
                .map(this::toCarDTO)
                .collect(Collectors.toList());
    }

    // ---- Validation ----

    public void validatePermissionLevel(String level) {
        if (!VALID_PERMISSION_LEVELS.contains(level)) {
            throw new ValidationException("INVALID_PERMISSION_LEVEL",
                    "Permission level must be one of: staff, public, anonymous. Got: " + level);
        }
    }

    // ---- Private helpers ----

    private Category loadCategory(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CATEGORY_NOT_FOUND",
                        "Category not found: " + id));
    }

    private CategoryGroup loadCategoryGroup(Integer id) {
        return categoryGroupRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CATEGORY_GROUP_NOT_FOUND",
                        "Category group not found: " + id));
    }

    private void mapRequestToCategory(CreateCategoryRequest req, Category cat) {
        if (req.getName() != null) cat.setName(req.getName());
        if (req.getDescription() != null) cat.setDescription(req.getDescription());
        if (req.getActive() != null) cat.setActive(req.getActive());
        else if (cat.getActive() == null) cat.setActive(true);
        if (req.getFeatured() != null) cat.setFeatured(req.getFeatured());
        else if (cat.getFeatured() == null) cat.setFeatured(false);
        if (req.getDisplayPermissionLevel() != null)
            cat.setDisplayPermissionLevel(req.getDisplayPermissionLevel());
        else if (cat.getDisplayPermissionLevel() == null)
            cat.setDisplayPermissionLevel("anonymous");
        if (req.getPostingPermissionLevel() != null)
            cat.setPostingPermissionLevel(req.getPostingPermissionLevel());
        else if (cat.getPostingPermissionLevel() == null)
            cat.setPostingPermissionLevel("anonymous");
        if (req.getCustomFields() != null) cat.setCustomFields(req.getCustomFields());
        if (req.getSlaDays() != null) cat.setSlaDays(req.getSlaDays());
        if (req.getNotificationReplyEmail() != null)
            cat.setNotificationReplyEmail(req.getNotificationReplyEmail());
        if (req.getAutoCloseIsActive() != null)
            cat.setAutoCloseIsActive(req.getAutoCloseIsActive());
        else if (cat.getAutoCloseIsActive() == null)
            cat.setAutoCloseIsActive(false);

        // Relations
        if (req.getDepartment_id() != null) {
            Department dept = departmentRepository.findById(req.getDepartment_id())
                    .orElseThrow(() -> new NotFoundException("DEPARTMENT_NOT_FOUND",
                            "Department not found: " + req.getDepartment_id()));
            cat.setDepartment(dept);
        }
        if (req.getDefaultPerson_id() != null) {
            Person person = personRepository.findById(req.getDefaultPerson_id())
                    .orElseThrow(() -> new NotFoundException("PERSON_NOT_FOUND",
                            "Person not found: " + req.getDefaultPerson_id()));
            cat.setDefaultPerson(person);
        }
        if (req.getCategoryGroup_id() != null) {
            CategoryGroup group = categoryGroupRepository.findById(req.getCategoryGroup_id())
                    .orElseThrow(() -> new NotFoundException("CATEGORY_GROUP_NOT_FOUND",
                            "Category group not found: " + req.getCategoryGroup_id()));
            cat.setCategoryGroup(group);
        }
        if (req.getAutoCloseSubstatus_id() != null) {
            Substatus substatus = substatusRepository.findById(req.getAutoCloseSubstatus_id())
                    .orElseThrow(() -> new NotFoundException("SUBSTATUS_NOT_FOUND",
                            "Substatus not found: " + req.getAutoCloseSubstatus_id()));
            cat.setAutoCloseSubstatus(substatus);
        }
    }

    public CategoryResponse toResponse(Category cat) {
        CategoryResponse resp = new CategoryResponse();
        resp.setId(cat.getId());
        resp.setName(cat.getName());
        resp.setDescription(cat.getDescription());
        resp.setActive(cat.getActive());
        resp.setFeatured(cat.getFeatured());
        resp.setDisplayPermissionLevel(cat.getDisplayPermissionLevel());
        resp.setPostingPermissionLevel(cat.getPostingPermissionLevel());
        resp.setCustomFields(cat.getCustomFields());
        resp.setLastModified(cat.getLastModified());
        resp.setSlaDays(cat.getSlaDays());
        resp.setNotificationReplyEmail(cat.getNotificationReplyEmail());
        resp.setAutoCloseIsActive(cat.getAutoCloseIsActive());

        if (cat.getDepartment() != null) {
            resp.setDepartment_id(cat.getDepartment().getId());
            resp.setDepartmentName(cat.getDepartment().getName());
        }
        if (cat.getDefaultPerson() != null) {
            resp.setDefaultPerson_id(cat.getDefaultPerson().getId());
            resp.setDefaultPersonName(cat.getDefaultPerson().getFullName());
        }
        if (cat.getCategoryGroup() != null) {
            resp.setCategoryGroup_id(cat.getCategoryGroup().getId());
            resp.setCategoryGroupName(cat.getCategoryGroup().getName());
        }
        if (cat.getAutoCloseSubstatus() != null) {
            resp.setAutoCloseSubstatus_id(cat.getAutoCloseSubstatus().getId());
        }
        if (cat.getActionResponses() != null) {
            resp.setActionResponses(cat.getActionResponses().stream()
                    .map(this::toCarDTO)
                    .collect(Collectors.toList()));
        }
        return resp;
    }

    private CategoryResponse.CategoryActionResponseDTO toCarDTO(CategoryActionResponse car) {
        CategoryResponse.CategoryActionResponseDTO dto = new CategoryResponse.CategoryActionResponseDTO();
        dto.setId(car.getId());
        dto.setTemplate(car.getTemplate());
        dto.setReplyEmail(car.getReplyEmail());
        if (car.getAction() != null) {
            dto.setAction_id(car.getAction().getId());
            dto.setActionName(car.getAction().getName());
        }
        return dto;
    }

    private CategoryGroupResponse toGroupResponse(CategoryGroup group) {
        CategoryGroupResponse resp = new CategoryGroupResponse();
        resp.setId(group.getId());
        resp.setName(group.getName());
        resp.setOrdering(group.getOrdering());
        return resp;
    }

    private CategoryGroupResponse toGroupResponseWithCategories(CategoryGroup group) {
        CategoryGroupResponse resp = toGroupResponse(group);
        List<Category> categories = categoryRepository.findByCategoryGroupId(group.getId());
        resp.setCategories(categories.stream().map(this::toResponse).collect(Collectors.toList()));
        return resp;
    }
}
