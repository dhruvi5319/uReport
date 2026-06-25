package com.ureport.service;

import com.ureport.dto.request.CreatePersonRequest;
import com.ureport.dto.request.UpdatePersonRequest;
import com.ureport.dto.response.PersonResponse;
import com.ureport.entity.Department;
import com.ureport.entity.PeopleAddress;
import com.ureport.entity.PeopleEmail;
import com.ureport.entity.PeoplePhone;
import com.ureport.entity.Person;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.DepartmentRepository;
import com.ureport.repository.PersonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PersonService {

    private final PersonRepository personRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public PersonService(PersonRepository personRepository,
                         DepartmentRepository departmentRepository,
                         PasswordEncoder passwordEncoder) {
        this.personRepository = personRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates a new person. BCrypts the password if provided.
     * Throws 409 USERNAME_CONFLICT if username already taken.
     */
    public PersonResponse createPerson(CreatePersonRequest req) {
        // Validate unique username
        if (req.getUsername() != null && !req.getUsername().isBlank()) {
            personRepository.findByUsername(req.getUsername()).ifPresent(p -> {
                throw new ValidationException("USERNAME_CONFLICT",
                        "Username already exists: " + req.getUsername());
            });
        }

        Person person = new Person();
        mapRequestToPerson(req, person);

        // BCrypt password
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            person.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }

        // Set department
        if (req.getDepartment_id() != null) {
            Department dept = departmentRepository.findById(req.getDepartment_id())
                    .orElseThrow(() -> new NotFoundException("DEPARTMENT_NOT_FOUND",
                            "Department not found: " + req.getDepartment_id()));
            person.setDepartment(dept);
        }

        // Add emails
        if (req.getEmails() != null) {
            for (CreatePersonRequest.CreateEmailRequest emailReq : req.getEmails()) {
                PeopleEmail email = new PeopleEmail();
                email.setPerson(person);
                email.setEmail(emailReq.getEmail());
                email.setLabel(emailReq.getLabel());
                email.setUsedForNotifications(emailReq.isUsedForNotifications());
                person.getEmails().add(email);
            }
        }

        // Add phones
        if (req.getPhones() != null) {
            for (CreatePersonRequest.CreatePhoneRequest phoneReq : req.getPhones()) {
                PeoplePhone phone = new PeoplePhone();
                phone.setPerson(person);
                phone.setNumber(phoneReq.getNumber());
                phone.setLabel(phoneReq.getLabel());
                person.getPhones().add(phone);
            }
        }

        // Add addresses
        if (req.getAddresses() != null) {
            for (CreatePersonRequest.CreateAddressRequest addrReq : req.getAddresses()) {
                PeopleAddress addr = new PeopleAddress();
                addr.setPerson(person);
                addr.setAddress(addrReq.getAddress());
                addr.setCity(addrReq.getCity());
                addr.setState(addrReq.getState());
                addr.setZip(addrReq.getZip());
                addr.setLabel(addrReq.getLabel());
                person.getAddresses().add(addr);
            }
        }

        person = personRepository.save(person);
        return toResponse(person);
    }

    @Transactional(readOnly = true)
    public PersonResponse getPerson(Integer id) {
        Person person = loadPerson(id);
        return toResponse(person);
    }

    @Transactional(readOnly = true)
    public Page<PersonResponse> searchPeople(String q, String role, Integer departmentId,
                                              int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<Person> results;
        if (q != null && !q.isBlank()) {
            results = personRepository.searchPeople(q, pageable);
        } else {
            results = personRepository.findByDeletedAtIsNull(pageable);
        }
        return results.map(this::toResponse);
    }

    public PersonResponse updatePerson(Integer id, UpdatePersonRequest req) {
        Person person = loadPerson(id);

        if (req.getUsername() != null && !req.getUsername().equals(person.getUsername())) {
            personRepository.findByUsername(req.getUsername()).ifPresent(p -> {
                throw new ValidationException("USERNAME_CONFLICT",
                        "Username already exists: " + req.getUsername());
            });
            person.setUsername(req.getUsername());
        }
        if (req.getFirstname() != null) person.setFirstname(req.getFirstname());
        if (req.getLastname() != null) person.setLastname(req.getLastname());
        if (req.getMiddlename() != null) person.setMiddlename(req.getMiddlename());
        if (req.getOrganization() != null) person.setOrganization(req.getOrganization());
        if (req.getAddress() != null) person.setAddress(req.getAddress());
        if (req.getCity() != null) person.setCity(req.getCity());
        if (req.getState() != null) person.setState(req.getState());
        if (req.getZip() != null) person.setZip(req.getZip());
        if (req.getRole() != null) person.setRole(req.getRole());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            person.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getDepartment_id() != null) {
            Department dept = departmentRepository.findById(req.getDepartment_id())
                    .orElseThrow(() -> new NotFoundException("DEPARTMENT_NOT_FOUND",
                            "Department not found: " + req.getDepartment_id()));
            person.setDepartment(dept);
        }

        person = personRepository.save(person);
        return toResponse(person);
    }

    public void softDeletePerson(Integer id) {
        Person person = loadPerson(id);
        person.setDeletedAt(OffsetDateTime.now());
        personRepository.save(person);
    }

    // ---- Email management ----

    public PersonResponse addEmail(Integer personId, CreatePersonRequest.CreateEmailRequest req) {
        Person person = loadPerson(personId);
        PeopleEmail email = new PeopleEmail();
        email.setPerson(person);
        email.setEmail(req.getEmail());
        email.setLabel(req.getLabel());
        email.setUsedForNotifications(req.isUsedForNotifications());
        person.getEmails().add(email);
        person = personRepository.save(person);
        return toResponse(person);
    }

    public PersonResponse updateEmail(Integer personId, Integer emailId, CreatePersonRequest.CreateEmailRequest req) {
        Person person = loadPerson(personId);
        PeopleEmail email = person.getEmails().stream()
                .filter(e -> e.getId().equals(emailId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("EMAIL_NOT_FOUND", "Email not found: " + emailId));
        if (req.getEmail() != null) email.setEmail(req.getEmail());
        if (req.getLabel() != null) email.setLabel(req.getLabel());
        email.setUsedForNotifications(req.isUsedForNotifications());
        person = personRepository.save(person);
        return toResponse(person);
    }

    public void deleteEmail(Integer personId, Integer emailId) {
        Person person = loadPerson(personId);
        person.getEmails().removeIf(e -> e.getId().equals(emailId));
        personRepository.save(person);
    }

    // ---- Phone management ----

    public PersonResponse addPhone(Integer personId, CreatePersonRequest.CreatePhoneRequest req) {
        Person person = loadPerson(personId);
        PeoplePhone phone = new PeoplePhone();
        phone.setPerson(person);
        phone.setNumber(req.getNumber());
        phone.setLabel(req.getLabel());
        person.getPhones().add(phone);
        person = personRepository.save(person);
        return toResponse(person);
    }

    public PersonResponse updatePhone(Integer personId, Integer phoneId, CreatePersonRequest.CreatePhoneRequest req) {
        Person person = loadPerson(personId);
        PeoplePhone phone = person.getPhones().stream()
                .filter(p -> p.getId().equals(phoneId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("PHONE_NOT_FOUND", "Phone not found: " + phoneId));
        if (req.getNumber() != null) phone.setNumber(req.getNumber());
        if (req.getLabel() != null) phone.setLabel(req.getLabel());
        person = personRepository.save(person);
        return toResponse(person);
    }

    public void deletePhone(Integer personId, Integer phoneId) {
        Person person = loadPerson(personId);
        person.getPhones().removeIf(p -> p.getId().equals(phoneId));
        personRepository.save(person);
    }

    // ---- Address management ----

    public PersonResponse addAddress(Integer personId, CreatePersonRequest.CreateAddressRequest req) {
        Person person = loadPerson(personId);
        PeopleAddress addr = new PeopleAddress();
        addr.setPerson(person);
        addr.setAddress(req.getAddress());
        addr.setCity(req.getCity());
        addr.setState(req.getState());
        addr.setZip(req.getZip());
        addr.setLabel(req.getLabel());
        person.getAddresses().add(addr);
        person = personRepository.save(person);
        return toResponse(person);
    }

    public PersonResponse updateAddress(Integer personId, Integer addrId, CreatePersonRequest.CreateAddressRequest req) {
        Person person = loadPerson(personId);
        PeopleAddress addr = person.getAddresses().stream()
                .filter(a -> a.getId().equals(addrId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("ADDRESS_NOT_FOUND", "Address not found: " + addrId));
        if (req.getAddress() != null) addr.setAddress(req.getAddress());
        if (req.getCity() != null) addr.setCity(req.getCity());
        if (req.getState() != null) addr.setState(req.getState());
        if (req.getZip() != null) addr.setZip(req.getZip());
        if (req.getLabel() != null) addr.setLabel(req.getLabel());
        person = personRepository.save(person);
        return toResponse(person);
    }

    public void deleteAddress(Integer personId, Integer addrId) {
        Person person = loadPerson(personId);
        person.getAddresses().removeIf(a -> a.getId().equals(addrId));
        personRepository.save(person);
    }

    /**
     * Find or create a person from Open311 submission data.
     * Called by Open311RequestsController and TicketService.
     * Returns the Person entity (NOT a DTO) for FK assignment.
     */
    public Person findOrCreateFromOpen311(String firstName, String lastName,
                                          String email, String phone) {
        // Try to find by email first (case-insensitive)
        if (email != null && !email.isBlank()) {
            Optional<Person> existing = personRepository.findByEmailsEmailIgnoreCase(email);
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        // Create new person (public constituent)
        Person person = new Person();
        if (firstName != null) person.setFirstname(firstName);
        else person.setFirstname("");
        if (lastName != null) person.setLastname(lastName);
        else person.setLastname("");
        person.setRole(null); // public constituent has no role

        // Add email if provided
        if (email != null && !email.isBlank()) {
            PeopleEmail peopleEmail = new PeopleEmail();
            peopleEmail.setPerson(person);
            peopleEmail.setEmail(email);
            peopleEmail.setUsedForNotifications(true);
            person.getEmails().add(peopleEmail);
        }

        // Add phone if provided
        if (phone != null && !phone.isBlank()) {
            PeoplePhone peoplePhone = new PeoplePhone();
            peoplePhone.setPerson(person);
            peoplePhone.setNumber(phone);
            peoplePhone.setLabel("Main");
            person.getPhones().add(peoplePhone);
        }

        return personRepository.save(person);
    }

    // ---- Private helpers ----

    private Person loadPerson(Integer id) {
        return personRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new NotFoundException("PERSON_NOT_FOUND",
                        "Person not found: " + id));
    }

    private void mapRequestToPerson(CreatePersonRequest req, Person person) {
        person.setFirstname(req.getFirstname());
        person.setLastname(req.getLastname());
        person.setMiddlename(req.getMiddlename());
        person.setOrganization(req.getOrganization());
        person.setAddress(req.getAddress());
        person.setCity(req.getCity());
        person.setState(req.getState());
        person.setZip(req.getZip());
        person.setUsername(req.getUsername());
        person.setRole(req.getRole());
    }

    public PersonResponse toResponse(Person person) {
        PersonResponse resp = new PersonResponse();
        resp.setId(person.getId());
        resp.setFirstname(person.getFirstname());
        resp.setMiddlename(person.getMiddlename());
        resp.setLastname(person.getLastname());
        resp.setOrganization(person.getOrganization());
        resp.setAddress(person.getAddress());
        resp.setCity(person.getCity());
        resp.setState(person.getState());
        resp.setZip(person.getZip());
        resp.setUsername(person.getUsername());
        resp.setRole(person.getRole());

        if (person.getDepartment() != null) {
            resp.setDepartment_id(person.getDepartment().getId());
            resp.setDepartmentName(person.getDepartment().getName());
        }

        // Map emails
        if (person.getEmails() != null) {
            resp.setEmails(person.getEmails().stream().map(e -> {
                PersonResponse.PersonEmailDTO dto = new PersonResponse.PersonEmailDTO();
                dto.setId(e.getId());
                dto.setEmail(e.getEmail());
                dto.setLabel(e.getLabel());
                dto.setUsedForNotifications(e.isUsedForNotifications());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map phones
        if (person.getPhones() != null) {
            resp.setPhones(person.getPhones().stream().map(p -> {
                PersonResponse.PersonPhoneDTO dto = new PersonResponse.PersonPhoneDTO();
                dto.setId(p.getId());
                dto.setNumber(p.getNumber());
                dto.setLabel(p.getLabel());
                return dto;
            }).collect(Collectors.toList()));
        }

        // Map addresses
        if (person.getAddresses() != null) {
            resp.setAddresses(person.getAddresses().stream().map(a -> {
                PersonResponse.PersonAddressDTO dto = new PersonResponse.PersonAddressDTO();
                dto.setId(a.getId());
                dto.setAddress(a.getAddress());
                dto.setCity(a.getCity());
                dto.setState(a.getState());
                dto.setZip(a.getZip());
                dto.setLabel(a.getLabel());
                return dto;
            }).collect(Collectors.toList()));
        }

        return resp;
    }
}
