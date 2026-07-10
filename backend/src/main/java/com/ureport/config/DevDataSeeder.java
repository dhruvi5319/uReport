package com.ureport.config;

import com.ureport.domain.*;
import com.ureport.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Seeds minimal reference data for the 'dev' profile (H2 in-memory database).
 * Enables the React frontend to render dropdowns, category tiles, etc.
 * during development without requiring a live PostgreSQL database with Flyway migrations.
 *
 * Dev credentials: username=devadmin / password=admin123 (role "admin")
 *                  username=devstaff / password=staff123 (role "staff", non-admin)
 * Use POST /api/auth/dev-login to obtain a JWT cookie for testing authenticated endpoints.
 */
@Configuration
@Profile("dev")
public class DevDataSeeder {

    @Bean
    CommandLineRunner seedDevData(
            ContactMethodRepository contactMethodRepo,
            SubstatusRepository substatusRepo,
            IssueTypeRepository issueTypeRepo,
            CategoryGroupRepository categoryGroupRepo,
            CategoryRepository categoryRepo,
            ActionsRepository actionsRepo,
            DepartmentRepository deptRepo,
            PersonRepository personRepo
    ) {
        return args -> {

            // --- Contact Methods (Phone, Email, Walk-in, Mail) ---
            // Matches V1 migration: INSERT INTO contact_methods (name) VALUES ('Email'), ('Phone'), ('Web Form'), ('Other');
            if (contactMethodRepo.count() == 0) {
                for (String name : new String[]{"Phone", "Email", "Walk-in", "Mail"}) {
                    ContactMethod cm = new ContactMethod();
                    cm.setName(name);
                    contactMethodRepo.save(cm);
                }
            }

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

            // --- Issue Types (matching V1 migration names exactly) ---
            if (issueTypeRepo.count() == 0) {
                for (String name : new String[]{"Comment", "Complaint", "Question", "Report", "Request", "Violation"}) {
                    IssueType it = new IssueType();
                    it.setName(name);
                    issueTypeRepo.save(it);
                }
            }

            // --- Departments ---
            Department dept;
            if (deptRepo.count() == 0) {
                dept = new Department();
                dept.setName("Public Works");
                dept = deptRepo.save(dept);
            } else {
                dept = deptRepo.findAll().iterator().next();
            }

            // --- Dev Persons (for JWT authentication in dev mode) ---
            // Credentials: devadmin / admin123  (role "admin")
            //              devstaff / staff123  (role "staff" — non-admin, for
            //              exercising the AdminGuard redirect: /admin/* -> /dashboard)
            if (personRepo.count() == 0) {
                BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

                Person admin = new Person();
                admin.setUsername("devadmin");
                admin.setFirstname("Dev");
                admin.setLastname("Admin");
                admin.setRole("admin");
                admin.setPasswordHash(encoder.encode("admin123"));
                admin.setDepartment(dept);
                personRepo.save(admin);

                Person staff = new Person();
                staff.setUsername("devstaff");
                staff.setFirstname("Dev");
                staff.setLastname("Staff");
                staff.setRole("staff");
                staff.setPasswordHash(encoder.encode("staff123"));
                staff.setDepartment(dept);
                personRepo.save(staff);
            }

            // --- Category Groups + Categories (for StepCategory wizard and accordion) ---
            if (categoryGroupRepo.count() == 0) {
                // Group 1: Streets/Roads (matches V1 seed name variant)
                CategoryGroup roads = new CategoryGroup();
                roads.setName("Streets");
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

                // Group 2: Sanitation
                CategoryGroup sanitation = new CategoryGroup();
                sanitation.setName("Sanitation");
                sanitation.setOrdering((short) 2);
                sanitation = categoryGroupRepo.save(sanitation);

                Category trash = new Category();
                trash.setName("Overflowing Trash");
                trash.setDescription("Report overflowing trash bins");
                trash.setCategoryGroup(sanitation);
                trash.setDepartment(dept);
                trash.setActive(true);
                trash.setFeatured(true);
                trash.setDisplayPermissionLevel("anonymous");
                trash.setPostingPermissionLevel("anonymous");
                categoryRepo.save(trash);

                // Group 3: Other
                CategoryGroup other = new CategoryGroup();
                other.setName("Other");
                other.setOrdering((short) 3);
                other = categoryGroupRepo.save(other);

                Category general = new Category();
                general.setName("General Request");
                general.setDescription("General service request");
                general.setCategoryGroup(other);
                general.setDepartment(dept);
                general.setActive(true);
                general.setFeatured(false);
                general.setDisplayPermissionLevel("anonymous");
                general.setPostingPermissionLevel("anonymous");
                categoryRepo.save(general);
            }

            // --- Actions (system actions matching V1 migration — 10 entries) ---
            if (actionsRepo.count() == 0) {
                String[][] actions = {
                    {"open",           "system", "Opened by {actionPerson}"},
                    {"assignment",     "system", "{enteredByPerson} assigned this case to {actionPerson}"},
                    {"closed",         "system", "Closed by {actionPerson}"},
                    {"changeCategory", "system", "Changed category from {original:category_id} to {updated:category_id}"},
                    {"changeLocation", "system", "Changed location from {original:location} to {updated:location}"},
                    {"response",       "system", "{actionPerson} contacted {reportedByPerson_id}"},
                    {"duplicate",      "system", "{duplicate:ticket_id} marked as a duplicate of this case."},
                    {"update",         "system", "{enteredByPerson} updated this case."},
                    {"comment",        "system", "{enteredByPerson} commented on this case."},
                    {"upload_media",   "system", "{enteredByPerson} uploaded an attachment."},
                };
                for (String[] row : actions) {
                    Action a = new Action();
                    a.setName(row[0]);
                    a.setType(row[1]);
                    a.setDescription(row[2]);
                    actionsRepo.save(a);
                }
            }
        };
    }
}
