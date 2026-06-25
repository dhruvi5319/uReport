package com.ureport.service;

import com.ureport.dto.request.CreatePersonRequest;
import com.ureport.dto.response.PersonResponse;
import com.ureport.entity.Person;
import com.ureport.entity.PeopleEmail;
import com.ureport.exception.ValidationException;
import com.ureport.repository.DepartmentRepository;
import com.ureport.repository.PersonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PersonServiceTest {

    @Mock
    private PersonRepository personRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PersonService personService;

    private Person buildPerson(Integer id, String username) {
        Person p = new Person();
        p.setId(id);
        p.setFirstname("John");
        p.setLastname("Doe");
        p.setUsername(username);
        p.setRole("staff");
        return p;
    }

    @Test
    void createPerson_withDuplicateUsername_throws409() {
        CreatePersonRequest req = new CreatePersonRequest();
        req.setFirstname("Jane");
        req.setLastname("Smith");
        req.setUsername("jsmith");

        when(personRepository.findByUsername("jsmith")).thenReturn(Optional.of(buildPerson(1, "jsmith")));

        assertThatThrownBy(() -> personService.createPerson(req))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("USERNAME_CONFLICT");
    }

    @Test
    void createPerson_withPassword_bcryptHashesIt() {
        CreatePersonRequest req = new CreatePersonRequest();
        req.setFirstname("Jane");
        req.setLastname("Smith");
        req.setPassword("secret123");

        when(personRepository.findByUsername(any())).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("$2a$10$hashed");

        Person saved = buildPerson(2, null);
        saved.setPasswordHash("$2a$10$hashed");
        when(personRepository.save(any(Person.class))).thenReturn(saved);

        personService.createPerson(req);

        verify(passwordEncoder).encode("secret123");
        verify(personRepository).save(argThat(p -> "$2a$10$hashed".equals(p.getPasswordHash())));
    }

    @Test
    void softDeletePerson_setsDeletedAt() {
        Person person = buildPerson(1, "johndoe");
        when(personRepository.findById(1)).thenReturn(Optional.of(person));
        when(personRepository.save(any(Person.class))).thenReturn(person);

        personService.softDeletePerson(1);

        verify(personRepository).save(argThat(p -> p.getDeletedAt() != null));
    }

    @Test
    void findOrCreateFromOpen311_existingEmail_returnsExisting() {
        Person existing = buildPerson(5, "existing@example.com");
        when(personRepository.findByEmailsEmailIgnoreCase("existing@example.com"))
                .thenReturn(Optional.of(existing));

        Person result = personService.findOrCreateFromOpen311("John", "Doe", "existing@example.com", null);

        assertThat(result.getId()).isEqualTo(5);
        verify(personRepository, never()).save(any());
    }

    @Test
    void findOrCreateFromOpen311_noMatch_createsNewPerson() {
        when(personRepository.findByEmailsEmailIgnoreCase("new@example.com"))
                .thenReturn(Optional.empty());

        Person newPerson = new Person();
        newPerson.setId(10);
        newPerson.setFirstname("Jane");
        newPerson.setLastname("Doe");
        when(personRepository.save(any(Person.class))).thenReturn(newPerson);

        Person result = personService.findOrCreateFromOpen311("Jane", "Doe", "new@example.com", "555-1234");

        assertThat(result.getId()).isEqualTo(10);
        verify(personRepository).save(argThat(p ->
                p.getEmails().size() == 1 && p.getPhones().size() == 1
        ));
    }

    @Test
    void findOrCreateFromOpen311_noEmail_createsPersonWithoutEmail() {
        Person newPerson = new Person();
        newPerson.setId(11);
        newPerson.setFirstname("Anonymous");
        newPerson.setLastname("User");
        when(personRepository.save(any(Person.class))).thenReturn(newPerson);

        Person result = personService.findOrCreateFromOpen311("Anonymous", "User", null, null);

        assertThat(result.getId()).isEqualTo(11);
        verify(personRepository).save(argThat(p ->
                p.getEmails().isEmpty() && p.getPhones().isEmpty()
        ));
    }
}
