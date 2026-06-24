package com.ureport.service;

import com.ureport.dto.request.CreateCategoryRequest;
import com.ureport.dto.response.CategoryResponse;
import com.ureport.entity.Action;
import com.ureport.entity.Category;
import com.ureport.entity.CategoryActionResponse;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryGroupRepository categoryGroupRepository;

    @Mock
    private CategoryActionResponseRepository carRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private SubstatusRepository substatusRepository;

    @Mock
    private ActionRepository actionRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category buildCategory(Integer id, String name, String displayPermLevel) {
        Category c = new Category();
        c.setId(id);
        c.setName(name);
        c.setActive(true);
        c.setDisplayPermissionLevel(displayPermLevel);
        c.setPostingPermissionLevel("anonymous");
        c.setFeatured(false);
        c.setAutoCloseIsActive(false);
        return c;
    }

    @Test
    void createCategory_withInvalidPermissionLevel_throws422() {
        CreateCategoryRequest req = new CreateCategoryRequest();
        req.setName("Test Category");
        req.setDisplayPermissionLevel("superuser"); // invalid

        assertThatThrownBy(() -> categoryService.createCategory(req))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("INVALID_PERMISSION_LEVEL");
    }

    @Test
    void listCategories_anonymousCaller_filtersToAnonymousOnly() {
        Category anonymousCat = buildCategory(1, "Public Pothole", "anonymous");
        Category publicCat = buildCategory(2, "Staff Report", "public");
        Category staffCat = buildCategory(3, "Internal", "staff");

        when(categoryRepository.findByActiveTrue())
                .thenReturn(List.of(anonymousCat, publicCat, staffCat));

        List<CategoryResponse> result = categoryService.listCategories("anonymous");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDisplayPermissionLevel()).isEqualTo("anonymous");
    }

    @Test
    void listCategories_publicCaller_includesPublicAndAnonymous() {
        Category anonymousCat = buildCategory(1, "Pothole", "anonymous");
        Category publicCat = buildCategory(2, "Feedback", "public");
        Category staffCat = buildCategory(3, "Internal", "staff");

        when(categoryRepository.findByActiveTrue())
                .thenReturn(List.of(anonymousCat, publicCat, staffCat));

        List<CategoryResponse> result = categoryService.listCategories("public");

        assertThat(result).hasSize(2);
    }

    @Test
    void upsertCategoryActionResponse_existingRecord_updates() {
        Category cat = buildCategory(1, "Roads", "anonymous");
        Action action = new Action();
        action.setId(2);
        action.setName("Close Ticket");
        action.setType("system");

        CategoryActionResponse existing = new CategoryActionResponse();
        existing.setId(10);
        existing.setCategory(cat);
        existing.setAction(action);
        existing.setTemplate("Old template");

        when(categoryRepository.findById(1)).thenReturn(Optional.of(cat));
        when(actionRepository.findById(2)).thenReturn(Optional.of(action));
        when(carRepository.findByCategoryIdAndActionId(1, 2)).thenReturn(Optional.of(existing));
        when(carRepository.save(any(CategoryActionResponse.class))).thenReturn(existing);

        categoryService.upsertCategoryActionResponse(1, 2, "New template", "reply@test.com");

        verify(carRepository).save(argThat(car ->
                "New template".equals(car.getTemplate())
                && "reply@test.com".equals(car.getReplyEmail())
        ));
    }

    @Test
    void upsertCategoryActionResponse_noExisting_creates() {
        Category cat = buildCategory(1, "Roads", "anonymous");
        Action action = new Action();
        action.setId(3);
        action.setName("Assignment");
        action.setType("system");

        when(categoryRepository.findById(1)).thenReturn(Optional.of(cat));
        when(actionRepository.findById(3)).thenReturn(Optional.of(action));
        when(carRepository.findByCategoryIdAndActionId(1, 3)).thenReturn(Optional.empty());
        when(carRepository.save(any(CategoryActionResponse.class))).thenAnswer(i -> i.getArgument(0));

        categoryService.upsertCategoryActionResponse(1, 3, "Template text", null);

        verify(carRepository).save(argThat(car ->
                car.getCategory() == cat && car.getAction() == action
        ));
    }

    @Test
    void validatePermissionLevel_invalidValue_throws422() {
        assertThatThrownBy(() -> categoryService.validatePermissionLevel("admin"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("INVALID_PERMISSION_LEVEL");
    }
}
