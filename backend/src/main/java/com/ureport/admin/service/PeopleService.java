package com.ureport.admin.service;

import com.ureport.admin.dto.*;
import com.ureport.admin.dto.PersonDetailDto.DepartmentRef;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.*;
import com.ureport.repository.*;
import com.ureport.security.PersonDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * People management service — CRUD for persons with nested email/phone/address sub-resources.
 *
 * Security mitigations (threat model):
 * - T-05-01: role guard prevents non-admin assigning role=admin or role=staff
 * - T-05-02: JPQL named parameters prevent SQL injection in search
 * - T-05-04: delete safety via ticketRepository.existsByEnteredByPersonId... → 409 PERSON_IN_USE
 * - T-05-05: array reconciliation only updates items already owned by this person's collections
 */
@Service
@Transactional
public class PeopleService {

    private final PersonRepository personRepository;
    private final DepartmentRepository departmentRepository;
    private final TicketRepository ticketRepository;

    public PeopleService(PersonRepository personRepository,
                          DepartmentRepository departmentRepository,
                          TicketRepository ticketRepository) {
        this.personRepository = personRepository;
        this.departmentRepository = departmentRepository;
        this.ticketRepository = ticketRepository;
    }

    // -----------------------------------------------------------------------
    // LIST
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PersonPageDto listPeople(String q, String role, int page, int pageSize) {
        // Normalize blank strings to null so JPQL IS NULL branch fires correctly
        String qParam = (q != null && !q.isBlank()) ? q : null;
        String roleParam = (role != null && !role.isBlank()) ? role : null;

        Page<Person> personPage = personRepository.searchPeople(
                qParam, roleParam, PageRequest.of(page, pageSize));

        List<PersonListItemDto> items = personPage.getContent().stream()
                .map(this::toListItemDto)
                .collect(Collectors.toList());

        return new PersonPageDto(items, personPage.getTotalElements(), page, pageSize);
    }

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    public PersonDetailDto createPerson(CreatePersonRequest req, PersonDetails currentUser) {
        // Name validation: at least one of firstname, lastname, organization must be non-blank
        if (isBlank(req.firstname) && isBlank(req.lastname) && isBlank(req.organization)) {
            throw new BusinessException("PERSON_NAME_REQUIRED",
                    "At least one of firstname, lastname, or organization is required",
                    HttpStatus.BAD_REQUEST);
        }

        // Username uniqueness check (T-05-02)
        if (!isBlank(req.username) && personRepository.existsByUsername(req.username)) {
            throw new BusinessException("USERNAME_CONFLICT",
                    "Username already in use", HttpStatus.CONFLICT);
        }

        // Role guard: only admins may assign role=admin or role=staff (T-05-01)
        if (req.role != null &&
                ("admin".equals(req.role) || "staff".equals(req.role)) &&
                !"admin".equals(currentUser.getRole())) {
            throw new BusinessException("ROLE_FORBIDDEN",
                    "Only admins may set role to admin or staff",
                    HttpStatus.FORBIDDEN);
        }

        // Department resolution
        Department dept = resolveDepartment(req.departmentId);

        Person person = new Person();
        setScalarFields(person, req.firstname, req.middlename, req.lastname, req.organization,
                req.address, req.city, req.state, req.zip, req.username, req.role, dept);

        // Reconcile sub-resources (add all from request — it's a create)
        addEmails(person, req.emails);
        addPhones(person, req.phones);
        addAddresses(person, req.addresses);

        person = personRepository.save(person);
        return toDetailDto(person);
    }

    // -----------------------------------------------------------------------
    // GET
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PersonDetailDto getPerson(Long id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found", HttpStatus.NOT_FOUND));
        // Force initialization of lazy collections
        person.getEmails().size();
        person.getPhones().size();
        person.getAddresses().size();
        return toDetailDto(person);
    }

    // -----------------------------------------------------------------------
    // UPDATE
    // -----------------------------------------------------------------------

    public PersonDetailDto updatePerson(Long id, UpdatePersonRequest req, PersonDetails currentUser) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found", HttpStatus.NOT_FOUND));

        // Role guard (T-05-01)
        if (req.role != null &&
                ("admin".equals(req.role) || "staff".equals(req.role)) &&
                !"admin".equals(currentUser.getRole())) {
            throw new BusinessException("ROLE_FORBIDDEN",
                    "Only admins may set role to admin or staff",
                    HttpStatus.FORBIDDEN);
        }

        // Username uniqueness: only check if username changed (T-05-02)
        if (!isBlank(req.username) &&
                personRepository.existsByUsernameAndIdNot(req.username, id)) {
            throw new BusinessException("USERNAME_CONFLICT",
                    "Username already in use", HttpStatus.CONFLICT);
        }

        // Update scalar fields
        Department dept = resolveDepartment(req.departmentId);
        setScalarFields(person, req.firstname, req.middlename, req.lastname, req.organization,
                req.address, req.city, req.state, req.zip, req.username, req.role, dept);

        // Reconcile emails (T-05-05: only IDs already owned by this person are updated)
        reconcileEmails(person, req.emails);
        reconcilePhones(person, req.phones);
        reconcileAddresses(person, req.addresses);

        person = personRepository.save(person);
        return toDetailDto(person);
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    public void deletePerson(Long id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found", HttpStatus.NOT_FOUND));

        // Delete safety: refuse if person is referenced by any ticket (T-05-04)
        if (ticketRepository.existsByEnteredByPersonIdOrReportedByPersonIdOrAssignedPersonId(
                id, id, id)) {
            throw new BusinessException("PERSON_IN_USE",
                    "Person is referenced by tickets and cannot be deleted",
                    HttpStatus.CONFLICT);
        }

        // CascadeType.ALL on emails/phones/addresses handles cascade deletes
        personRepository.delete(person);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private Department resolveDepartment(Long departmentId) {
        if (departmentId == null) return null;
        return departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BusinessException("DEPT_NOT_FOUND",
                        "Department not found", HttpStatus.NOT_FOUND));
    }

    private void setScalarFields(Person person,
                                  String firstname, String middlename, String lastname,
                                  String organization, String address, String city,
                                  String state, String zip, String username, String role,
                                  Department department) {
        if (firstname != null) person.setFirstname(firstname);
        if (middlename != null) person.setMiddlename(middlename);
        if (lastname != null) person.setLastname(lastname);
        if (organization != null) person.setOrganization(organization);
        if (address != null) person.setAddress(address);
        if (city != null) person.setCity(city);
        if (state != null) person.setState(state);
        if (zip != null) person.setZip(zip);
        if (username != null) person.setUsername(username);
        if (role != null) person.setRole(role);
        if (department != null) person.setDepartment(department);
    }

    private void addEmails(Person person, List<PersonEmailDto> emailDtos) {
        if (emailDtos == null) return;
        for (PersonEmailDto dto : emailDtos) {
            PeopleEmail email = new PeopleEmail();
            email.setEmail(dto.email);
            email.setLabel(dto.label);
            email.setUsedForNotifications(dto.usedForNotifications);
            email.setPerson(person);
            person.getEmails().add(email);
        }
    }

    private void addPhones(Person person, List<PersonPhoneDto> phoneDtos) {
        if (phoneDtos == null) return;
        for (PersonPhoneDto dto : phoneDtos) {
            PeoplePhone phone = new PeoplePhone();
            phone.setNumber(dto.number);
            phone.setLabel(dto.label);
            phone.setPerson(person);
            person.getPhones().add(phone);
        }
    }

    private void addAddresses(Person person, List<PersonAddressDto> addressDtos) {
        if (addressDtos == null) return;
        for (PersonAddressDto dto : addressDtos) {
            PeopleAddress addr = new PeopleAddress();
            addr.setAddress(dto.address);
            addr.setCity(dto.city);
            addr.setState(dto.state);
            addr.setZip(dto.zip);
            addr.setLabel(dto.label);
            addr.setPerson(person);
            person.getAddresses().add(addr);
        }
    }

    /**
     * Reconcile email collection (T-05-05):
     * - Items with null id → add as new
     * - Items with existing id owned by this person → update
     * - Items in person.emails not present in request → removed via orphanRemoval
     */
    private void reconcileEmails(Person person, List<PersonEmailDto> emailDtos) {
        if (emailDtos == null) return;

        // Build set of IDs from request (non-null only)
        Set<Long> requestIds = emailDtos.stream()
                .filter(d -> d.id != null)
                .map(d -> d.id)
                .collect(Collectors.toSet());

        // Remove emails not in request (orphanRemoval will delete them from DB)
        person.getEmails().removeIf(e -> e.getId() != null && !requestIds.contains(e.getId()));

        for (PersonEmailDto dto : emailDtos) {
            if (dto.id == null) {
                // New email
                PeopleEmail email = new PeopleEmail();
                email.setEmail(dto.email);
                email.setLabel(dto.label);
                email.setUsedForNotifications(dto.usedForNotifications);
                email.setPerson(person);
                person.getEmails().add(email);
            } else {
                // Update existing (only if owned by this person — T-05-05)
                person.getEmails().stream()
                        .filter(e -> dto.id.equals(e.getId()))
                        .findFirst()
                        .ifPresent(e -> {
                            e.setEmail(dto.email);
                            e.setLabel(dto.label);
                            e.setUsedForNotifications(dto.usedForNotifications);
                        });
            }
        }
    }

    private void reconcilePhones(Person person, List<PersonPhoneDto> phoneDtos) {
        if (phoneDtos == null) return;

        Set<Long> requestIds = phoneDtos.stream()
                .filter(d -> d.id != null)
                .map(d -> d.id)
                .collect(Collectors.toSet());

        person.getPhones().removeIf(p -> p.getId() != null && !requestIds.contains(p.getId()));

        for (PersonPhoneDto dto : phoneDtos) {
            if (dto.id == null) {
                PeoplePhone phone = new PeoplePhone();
                phone.setNumber(dto.number);
                phone.setLabel(dto.label);
                phone.setPerson(person);
                person.getPhones().add(phone);
            } else {
                person.getPhones().stream()
                        .filter(p -> dto.id.equals(p.getId()))
                        .findFirst()
                        .ifPresent(p -> {
                            p.setNumber(dto.number);
                            p.setLabel(dto.label);
                        });
            }
        }
    }

    private void reconcileAddresses(Person person, List<PersonAddressDto> addressDtos) {
        if (addressDtos == null) return;

        Set<Long> requestIds = addressDtos.stream()
                .filter(d -> d.id != null)
                .map(d -> d.id)
                .collect(Collectors.toSet());

        person.getAddresses().removeIf(a -> a.getId() != null && !requestIds.contains(a.getId()));

        for (PersonAddressDto dto : addressDtos) {
            if (dto.id == null) {
                PeopleAddress addr = new PeopleAddress();
                addr.setAddress(dto.address);
                addr.setCity(dto.city);
                addr.setState(dto.state);
                addr.setZip(dto.zip);
                addr.setLabel(dto.label);
                addr.setPerson(person);
                person.getAddresses().add(addr);
            } else {
                person.getAddresses().stream()
                        .filter(a -> dto.id.equals(a.getId()))
                        .findFirst()
                        .ifPresent(a -> {
                            a.setAddress(dto.address);
                            a.setCity(dto.city);
                            a.setState(dto.state);
                            a.setZip(dto.zip);
                            a.setLabel(dto.label);
                        });
            }
        }
    }

    // -----------------------------------------------------------------------
    // Mapping helpers
    // -----------------------------------------------------------------------

    private PersonListItemDto toListItemDto(Person person) {
        DepartmentRef deptRef = person.getDepartment() != null
                ? new DepartmentRef(person.getDepartment().getId(), person.getDepartment().getName())
                : null;
        return new PersonListItemDto(
                person.getId(),
                person.getFirstname(),
                person.getLastname(),
                person.getOrganization(),
                person.getEmail(),
                person.getRole(),
                deptRef
        );
    }

    private PersonDetailDto toDetailDto(Person person) {
        PersonDetailDto dto = new PersonDetailDto();
        dto.id = person.getId();
        dto.firstname = person.getFirstname();
        dto.middlename = person.getMiddlename();
        dto.lastname = person.getLastname();
        dto.organization = person.getOrganization();
        dto.address = person.getAddress();
        dto.city = person.getCity();
        dto.state = person.getState();
        dto.zip = person.getZip();
        dto.username = person.getUsername();
        dto.role = person.getRole();

        if (person.getDepartment() != null) {
            dto.department = new DepartmentRef(
                    person.getDepartment().getId(),
                    person.getDepartment().getName());
        }

        dto.emails = person.getEmails().stream()
                .map(e -> new PersonEmailDto(e.getId(), e.getEmail(), e.getLabel(),
                        Boolean.TRUE.equals(e.getUsedForNotifications())))
                .collect(Collectors.toList());

        dto.phones = person.getPhones().stream()
                .map(p -> new PersonPhoneDto(p.getId(), p.getNumber(), p.getLabel()))
                .collect(Collectors.toList());

        dto.addresses = person.getAddresses().stream()
                .map(a -> new PersonAddressDto(a.getId(), a.getAddress(), a.getCity(),
                        a.getState(), a.getZip(), a.getLabel()))
                .collect(Collectors.toList());

        return dto;
    }
}
