package com.ureport.config;

import com.ureport.domain.*;
import com.ureport.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Seeds minimal reference data for the 'dev' profile (H2 in-memory database).
 * This data enables the React frontend to render dropdowns, category tiles, etc.
 * during UAT without requiring a live PostgreSQL database.
 */
@Configuration
@Profile("dev")
public class DevDataSeeder {

    @Bean
    CommandLineRunner seedDevData(
            SubstatusRepository substatusRepo,
            IssueTypeRepository issueTypeRepo,
            CategoryGroupRepository categoryGroupRepo,
            CategoryRepository categoryRepo,
            ActionsRepository actionsRepo,
            DepartmentRepository deptRepo,
            PersonRepository personRepo
    ) {
        return args -> {

            // --- Substatuses (closed, resolved, etc.) ---
            if (substatusRepo.count() == 0) {
                Substatus resolved = new Substatus();
                resolved.setName("Resolved");
                resolved.setStatus("closed");
                resolved.setIsDefault(true);
                substatusRepo.save(resolved);

                Substatus duplicate = new Substatus();
                duplicate.setName("Duplicate");
                duplicate.setStatus("closed");
                duplicate.setIsDefault(false);
                substatusRepo.save(duplicate);

                Substatus bogus = new Substatus();
                bogus.setName("Bogus");
                bogus.setStatus("closed");
                bogus.setIsDefault(false);
                substatusRepo.save(bogus);
            }

            // --- Issue types ---
            if (issueTypeRepo.count() == 0) {
                for (String name : new String[]{"Complaint", "Service Request", "Inquiry", "Compliment", "Suggestion", "Other"}) {
                    IssueType it = new IssueType();
                    it.setName(name);
                    issueTypeRepo.save(it);
                }
            }

            // --- Departments ---
            Department dept = null;
            if (deptRepo.count() == 0) {
                dept = new Department();
                dept.setName("Public Works");
                deptRepo.save(dept);
            } else {
                dept = deptRepo.findAll().iterator().next();
            }

            // --- Category groups + categories (for StepCategory wizard) ---
            if (categoryGroupRepo.count() == 0) {
                // Group 1: Roads & Transportation
                CategoryGroup roads = new CategoryGroup();
                roads.setName("Roads & Transportation");
                roads.setOrdering((short) 1);
                roads = categoryGroupRepo.save(roads);

                Category pothole = new Category();
                pothole.setName("Pothole");
                pothole.setDescription("Report a pothole");
                pothole.setCategoryGroup(roads);
                pothole.setDepartment(dept);
                pothole.setActive(true);
                pothole.setFeatured(true);
                pothole.setDisplayPermissionLevel("anonymous");
                pothole.setPostingPermissionLevel("anonymous");
                categoryRepo.save(pothole);

                Category streetlight = new Category();
                streetlight.setName("Street Light Outage");
                streetlight.setDescription("Report a broken street light");
                streetlight.setCategoryGroup(roads);
                streetlight.setDepartment(dept);
                streetlight.setActive(true);
                streetlight.setFeatured(false);
                streetlight.setDisplayPermissionLevel("anonymous");
                streetlight.setPostingPermissionLevel("anonymous");
                categoryRepo.save(streetlight);

                // Group 2: Parks & Recreation
                CategoryGroup parks = new CategoryGroup();
                parks.setName("Parks & Recreation");
                parks.setOrdering((short) 2);
                parks = categoryGroupRepo.save(parks);

                Category trash = new Category();
                trash.setName("Overflowing Trash");
                trash.setDescription("Report overflowing trash bins in parks");
                trash.setCategoryGroup(parks);
                trash.setDepartment(dept);
                trash.setActive(true);
                trash.setFeatured(true);
                trash.setDisplayPermissionLevel("anonymous");
                trash.setPostingPermissionLevel("anonymous");
                categoryRepo.save(trash);

                // Group 3: Utilities
                CategoryGroup utilities = new CategoryGroup();
                utilities.setName("Utilities");
                utilities.setOrdering((short) 3);
                utilities = categoryGroupRepo.save(utilities);

                Category water = new Category();
                water.setName("Water Main Break");
                water.setDescription("Report a water main break");
                water.setCategoryGroup(utilities);
                water.setDepartment(dept);
                water.setActive(true);
                water.setFeatured(false);
                water.setDisplayPermissionLevel("anonymous");
                water.setPostingPermissionLevel("anonymous");
                categoryRepo.save(water);
            }

            // --- Actions (for ActionLogForm dropdown) ---
            if (actionsRepo.count() == 0) {
                for (String name : new String[]{"Assigned", "Investigated", "In Progress", "Resolved", "Closed - Unable to Reproduce", "Notified Reporter"}) {
                    Action a = new Action();
                    a.setName(name);
                    a.setType("system");
                    actionsRepo.save(a);
                }
            }
        };
    }
}
