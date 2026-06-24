package com.ureport.service;

import com.ureport.dto.request.CreateDepartmentRequest;
import com.ureport.dto.response.DepartmentResponse;
import com.ureport.entity.Category;
import com.ureport.entity.Department;
import com.ureport.entity.Person;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.ActionRepository;
import com.ureport.repository.CategoryRepository;
import com.ureport.repository.DepartmentRepository;
import com.ureport.repository.PersonRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ActionRepository actionRepository;

    @Mock
    private PersonService personService;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private DepartmentService departmentService;

    @Test
    void createDepartment_withNonStaffDefaultPerson_throws422() {
        CreateDepartmentRequest req = new CreateDepartmentRequest();
        req.setName("Engineering");
        req.setDefaultPerson_id(5);

        Person publicPerson = new Person();
        publicPerson.setId(5);
        publicPerson.setRole("public");
        when(personRepository.findById(5)).thenReturn(Optional.of(publicPerson));

        assertThatThrownBy(() -> departmentService.createDepartment(req))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("INVALID_ASSIGNEE");
    }

    @Test
    void setCategoryAssociations_replacesExistingAssociations() {
        Department dept = new Department();
        dept.setId(1);
        dept.setName("Engineering");

        Category cat1 = new Category();
        cat1.setId(10);
        Category cat2 = new Category();
        cat2.setId(20);

        when(departmentRepository.findById(1)).thenReturn(Optional.of(dept));
        when(categoryRepository.findById(10)).thenReturn(Optional.of(cat1));
        when(categoryRepository.findById(20)).thenReturn(Optional.of(cat2));
        when(departmentRepository.save(any(Department.class))).thenReturn(dept);

        departmentService.setCategoryAssociations(1, List.of(10, 20));

        verify(departmentRepository).save(argThat(d -> d.getCategories().size() == 2));
    }

    @Test
    void createDepartment_withStaffDefaultPerson_succeeds() {
        CreateDepartmentRequest req = new CreateDepartmentRequest();
        req.setName("IT");
        req.setDefaultPerson_id(3);

        Person staffPerson = new Person();
        staffPerson.setId(3);
        staffPerson.setRole("staff");
        staffPerson.setFirstname("Alice");
        staffPerson.setLastname("Smith");
        when(personRepository.findById(3)).thenReturn(Optional.of(staffPerson));

        Department saved = new Department();
        saved.setId(1);
        saved.setName("IT");
        saved.setDefaultPerson(staffPerson);
        when(departmentRepository.save(any(Department.class))).thenReturn(saved);

        DepartmentResponse resp = departmentService.createDepartment(req);

        assertThat(resp.getId()).isEqualTo(1);
        assertThat(resp.getName()).isEqualTo("IT");
    }
}
