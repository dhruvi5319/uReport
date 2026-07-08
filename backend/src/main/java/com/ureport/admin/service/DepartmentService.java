package com.ureport.admin.service;

import com.ureport.admin.dto.CreateDepartmentRequest;
import com.ureport.admin.dto.DepartmentDetailDto;
import com.ureport.admin.dto.DepartmentDetailDto.PersonRef;
import com.ureport.admin.dto.UpdateDepartmentRequest;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.*;
import com.ureport.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD service for Department management (F7).
 *
 * Security mitigations (threat model):
 * - T-05-08: all actionIds validated against Action table before creating DepartmentAction rows
 * - T-05-09: delete safety via categoryRepository.existsByDepartmentId → 409 DEPT_IN_USE
 * - T-05-10: JWT required — enforced in SecurityConfig and DepartmentController
 */
@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentActionRepository departmentActionRepository;
    private final CategoryRepository categoryRepository;
    private final PersonRepository personRepository;
    private final ActionsRepository actionsRepository;

    public DepartmentService(DepartmentRepository departmentRepository,
                              DepartmentActionRepository departmentActionRepository,
                              CategoryRepository categoryRepository,
                              PersonRepository personRepository,
                              ActionsRepository actionsRepository) {
        this.departmentRepository = departmentRepository;
        this.departmentActionRepository = departmentActionRepository;
        this.categoryRepository = categoryRepository;
        this.personRepository = personRepository;
        this.actionsRepository = actionsRepository;
    }

    // -----------------------------------------------------------------------
    // LIST
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<DepartmentDetailDto> listDepartments() {
        return departmentRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    public DepartmentDetailDto createDepartment(CreateDepartmentRequest req) {
        // Validate defaultPersonId if provided
        Person defaultPerson = resolveDefaultPerson(req.defaultPersonId);

        // Validate all actionIds exist (T-05-08)
        validateActionIds(req.actionIds);

        Department dept = new Department();
        dept.setName(req.name);
        dept.setDefaultPerson(defaultPerson);

        // Save first to get the generated ID
        dept = departmentRepository.save(dept);

        // Create DepartmentAction join rows
        reconcileActions(dept, req.actionIds);

        dept = departmentRepository.save(dept);
        return toDto(dept);
    }

    // -----------------------------------------------------------------------
    // GET
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public DepartmentDetailDto getDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found: " + id, HttpStatus.NOT_FOUND));
        return toDto(dept);
    }

    // -----------------------------------------------------------------------
    // UPDATE
    // -----------------------------------------------------------------------

    public DepartmentDetailDto updateDepartment(Long id, UpdateDepartmentRequest req) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found: " + id, HttpStatus.NOT_FOUND));

        // Validate new defaultPersonId if provided
        Person defaultPerson = resolveDefaultPerson(req.defaultPersonId);

        // Validate all new actionIds exist (T-05-08)
        validateActionIds(req.actionIds);

        dept.setName(req.name);
        dept.setDefaultPerson(defaultPerson);

        // Reconcile action associations: clear old, add new (orphanRemoval handles delete)
        reconcileActions(dept, req.actionIds);

        dept = departmentRepository.save(dept);
        return toDto(dept);
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found: " + id, HttpStatus.NOT_FOUND));

        // Safety check: refuse if categories reference this department (T-05-09)
        if (categoryRepository.existsByDepartmentId(id)) {
            throw new BusinessException("DEPT_IN_USE",
                    "Department has categories and cannot be deleted",
                    HttpStatus.CONFLICT);
        }

        // CascadeType.ALL will remove department_actions rows
        departmentRepository.delete(dept);
    }

    // -----------------------------------------------------------------------
    // GET CATEGORIES
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CategoryRef> getDepartmentCategories(Long deptId) {
        // Verify department exists
        departmentRepository.findById(deptId)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found: " + deptId, HttpStatus.NOT_FOUND));

        return categoryRepository.findByDepartmentId(deptId)
                .stream()
                .map(c -> new CategoryRef(c.getId(), c.getName(), c.getActive()))
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    // Inner DTO for categories sub-endpoint
    // -----------------------------------------------------------------------

    /** Lightweight category reference returned by GET /api/departments/{id}/categories. */
    public record CategoryRef(Long id, String name, Boolean active) {}

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Look up the Person by defaultPersonId, or return null if not provided.
     * Throws 404 BusinessException if the ID is provided but not found.
     */
    private Person resolveDefaultPerson(Long defaultPersonId) {
        if (defaultPersonId == null) {
            return null;
        }
        return personRepository.findById(defaultPersonId)
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found: " + defaultPersonId, HttpStatus.NOT_FOUND));
    }

    /**
     * Validate that all actionIds reference existing Action records (T-05-08).
     * Throws 404 BusinessException for the first missing actionId.
     */
    private void validateActionIds(List<Long> actionIds) {
        if (actionIds == null || actionIds.isEmpty()) {
            return;
        }
        for (Long actionId : actionIds) {
            actionsRepository.findById(actionId)
                    .orElseThrow(() -> new BusinessException("ACTION_NOT_FOUND",
                            "Action not found: " + actionId, HttpStatus.NOT_FOUND));
        }
    }

    /**
     * Reconcile the department_actions join table.
     * Clears the existing collection (orphanRemoval deletes old rows),
     * then adds new DepartmentAction entries for each actionId.
     */
    private void reconcileActions(Department dept, List<Long> actionIds) {
        // Clear existing — orphanRemoval will delete the DB rows on flush
        dept.getDepartmentActions().clear();

        if (actionIds != null) {
            for (Long actionId : actionIds) {
                DepartmentAction da = new DepartmentAction();
                da.setDepartmentId(dept.getId());
                da.setActionId(actionId);
                dept.getDepartmentActions().add(da);
            }
        }
    }

    /**
     * Map a Department entity to DepartmentDetailDto including categoryCount and actionIds.
     */
    private DepartmentDetailDto toDto(Department dept) {
        PersonRef personRef = null;
        if (dept.getDefaultPerson() != null) {
            Person p = dept.getDefaultPerson();
            personRef = new PersonRef(p.getId(), p.getFirstname(), p.getLastname());
        }

        long categoryCount = categoryRepository.countByDepartmentId(dept.getId());

        List<Long> actionIds = dept.getDepartmentActions()
                .stream()
                .map(DepartmentAction::getActionId)
                .collect(Collectors.toList());

        return new DepartmentDetailDto(dept.getId(), dept.getName(), personRef, categoryCount, actionIds);
    }
}
