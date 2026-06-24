package com.ureport.service;

import com.ureport.dto.request.CreateDepartmentRequest;
import com.ureport.dto.request.UpdateDepartmentRequest;
import com.ureport.dto.response.CategoryResponse;
import com.ureport.dto.response.DepartmentResponse;
import com.ureport.dto.response.PersonResponse;
import com.ureport.entity.Action;
import com.ureport.entity.Category;
import com.ureport.entity.Department;
import com.ureport.entity.Person;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.ActionRepository;
import com.ureport.repository.CategoryRepository;
import com.ureport.repository.DepartmentRepository;
import com.ureport.repository.PersonRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final PersonRepository personRepository;
    private final CategoryRepository categoryRepository;
    private final ActionRepository actionRepository;
    private final PersonService personService;
    private final CategoryService categoryService;

    public DepartmentService(DepartmentRepository departmentRepository,
                             PersonRepository personRepository,
                             CategoryRepository categoryRepository,
                             ActionRepository actionRepository,
                             @Lazy PersonService personService,
                             @Lazy CategoryService categoryService) {
        this.departmentRepository = departmentRepository;
        this.personRepository = personRepository;
        this.categoryRepository = categoryRepository;
        this.actionRepository = actionRepository;
        this.personService = personService;
        this.categoryService = categoryService;
    }

    /**
     * Creates a new department. defaultPerson_id must be a staff person if provided.
     */
    public DepartmentResponse createDepartment(CreateDepartmentRequest req) {
        Department dept = new Department();
        dept.setName(req.getName());

        if (req.getDefaultPerson_id() != null) {
            Person person = loadStaffPerson(req.getDefaultPerson_id());
            dept.setDefaultPerson(person);
        }

        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartment(Integer id) {
        return toResponse(loadDepartment(id));
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DepartmentResponse updateDepartment(Integer id, UpdateDepartmentRequest req) {
        Department dept = loadDepartment(id);
        if (req.getName() != null) dept.setName(req.getName());
        if (req.getDefaultPerson_id() != null) {
            Person person = loadStaffPerson(req.getDefaultPerson_id());
            dept.setDefaultPerson(person);
        }
        dept = departmentRepository.save(dept);
        return toResponse(dept);
    }

    public void deleteDepartment(Integer id) {
        if (!departmentRepository.existsById(id)) {
            throw new NotFoundException("DEPARTMENT_NOT_FOUND", "Department not found: " + id);
        }
        departmentRepository.deleteById(id);
    }

    /**
     * Replaces all category associations for a department.
     * Writes to department_categories join table via JPA cascade.
     */
    public void setCategoryAssociations(Integer departmentId, List<Integer> categoryIds) {
        Department dept = loadDepartment(departmentId);
        Set<Category> categories = new HashSet<>();
        if (categoryIds != null) {
            for (Integer catId : categoryIds) {
                Category cat = categoryRepository.findById(catId)
                        .orElseThrow(() -> new NotFoundException("CATEGORY_NOT_FOUND",
                                "Category not found: " + catId));
                categories.add(cat);
            }
        }
        dept.setCategories(categories);
        departmentRepository.save(dept);
    }

    /**
     * Replaces all action associations for a department.
     * Writes to department_actions join table via JPA cascade.
     */
    public void setActionAssociations(Integer departmentId, List<Integer> actionIds) {
        Department dept = loadDepartment(departmentId);
        Set<Action> actions = new HashSet<>();
        if (actionIds != null) {
            for (Integer actionId : actionIds) {
                Action action = actionRepository.findById(actionId)
                        .orElseThrow(() -> new NotFoundException("ACTION_NOT_FOUND",
                                "Action not found: " + actionId));
                actions.add(action);
            }
        }
        dept.setActions(actions);
        departmentRepository.save(dept);
    }

    @Transactional(readOnly = true)
    public List<PersonResponse> getDepartmentPeople(Integer departmentId) {
        loadDepartment(departmentId); // ensure exists
        return personRepository.findByDepartment_Id(departmentId).stream()
                .map(personService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getDepartmentCategories(Integer departmentId) {
        loadDepartment(departmentId); // ensure exists
        return categoryRepository.findByDepartmentId(departmentId).stream()
                .map(categoryService::toResponse)
                .collect(Collectors.toList());
    }

    // ---- Private helpers ----

    private Department loadDepartment(Integer id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("DEPARTMENT_NOT_FOUND",
                        "Department not found: " + id));
    }

    private Person loadStaffPerson(Integer personId) {
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new NotFoundException("PERSON_NOT_FOUND",
                        "Person not found: " + personId));
        if (!"staff".equalsIgnoreCase(person.getRole())) {
            throw new ValidationException("INVALID_ASSIGNEE",
                    "Default person must have role 'staff'");
        }
        return person;
    }

    public DepartmentResponse toResponse(Department dept) {
        DepartmentResponse resp = new DepartmentResponse();
        resp.setId(dept.getId());
        resp.setName(dept.getName());
        if (dept.getDefaultPerson() != null) {
            resp.setDefaultPerson_id(dept.getDefaultPerson().getId());
            resp.setDefaultPersonName(dept.getDefaultPerson().getFullName());
        }
        return resp;
    }
}
