package com.ureport.controller;

import com.ureport.dto.request.CreateDepartmentRequest;
import com.ureport.dto.request.UpdateDepartmentRequest;
import com.ureport.dto.response.CategoryResponse;
import com.ureport.dto.response.DepartmentResponse;
import com.ureport.dto.response.PersonResponse;
import com.ureport.service.DepartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/departments")
@PreAuthorize("hasRole('ROLE_STAFF')")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<DepartmentResponse> listDepartments() {
        return departmentService.listDepartments();
    }

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(@RequestBody CreateDepartmentRequest req) {
        return ResponseEntity.status(201).body(departmentService.createDepartment(req));
    }

    @GetMapping("/{id}")
    public DepartmentResponse getDepartment(@PathVariable Integer id) {
        return departmentService.getDepartment(id);
    }

    @PutMapping("/{id}")
    public DepartmentResponse updateDepartment(@PathVariable Integer id, @RequestBody UpdateDepartmentRequest req) {
        return departmentService.updateDepartment(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Integer id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/people")
    public List<PersonResponse> getDepartmentPeople(@PathVariable Integer id) {
        return departmentService.getDepartmentPeople(id);
    }

    @GetMapping("/{id}/categories")
    public List<CategoryResponse> getDepartmentCategories(@PathVariable Integer id) {
        return departmentService.getDepartmentCategories(id);
    }

    @PutMapping("/{id}/categories")
    public ResponseEntity<Void> setCategoryAssociations(@PathVariable Integer id,
                                                         @RequestBody Map<String, List<Integer>> body) {
        departmentService.setCategoryAssociations(id, body.get("categoryIds"));
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/actions")
    public ResponseEntity<Void> setActionAssociations(@PathVariable Integer id,
                                                       @RequestBody Map<String, List<Integer>> body) {
        departmentService.setActionAssociations(id, body.get("actionIds"));
        return ResponseEntity.ok().build();
    }
}
