package com.ureport.crm.service;

import com.ureport.crm.dto.ClientDetailDto;
import com.ureport.crm.dto.ClientDetailDto.ContactRef;
import com.ureport.crm.dto.CreateClientRequest;
import com.ureport.crm.dto.UpdateClientRequest;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.Client;
import com.ureport.domain.ContactMethod;
import com.ureport.domain.Person;
import com.ureport.repository.ClientRepository;
import com.ureport.repository.ContactMethodRepository;
import com.ureport.repository.PersonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD service for Open311 client management (F14).
 *
 * Security mitigations:
 * - T-04-22: api_key is UUID.randomUUID() on create (not guessable); returned only on create
 * - T-04-24: all endpoints require ADMIN role (enforced in ClientController)
 */
@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;
    private final PersonRepository personRepository;
    private final ContactMethodRepository contactMethodRepository;

    public ClientService(ClientRepository clientRepository,
                         PersonRepository personRepository,
                         ContactMethodRepository contactMethodRepository) {
        this.clientRepository = clientRepository;
        this.personRepository = personRepository;
        this.contactMethodRepository = contactMethodRepository;
    }

    // -----------------------------------------------------------------------
    // CREATE
    // -----------------------------------------------------------------------

    /**
     * Create a new Open311 client with a generated UUID api_key.
     * Returns ClientDetailDto with the actual api_key value (only time it is exposed).
     */
    public ClientDetailDto create(CreateClientRequest req) {
        // Validate contactPersonId
        Person contactPerson = personRepository.findById(req.contactPersonId())
                .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                        "Person not found: " + req.contactPersonId()));

        // Optional: validate contactMethodId
        ContactMethod contactMethod = null;
        if (req.contactMethodId() != null) {
            contactMethod = contactMethodRepository.findById(req.contactMethodId())
                    .orElseThrow(() -> new BusinessException("CONTACT_METHOD_NOT_FOUND",
                            "Contact method not found: " + req.contactMethodId()));
        }

        Client client = new Client();
        client.setName(req.name());
        client.setUrl(req.url());
        // Generate UUID api_key (T-04-22: not guessable, stored as-is per Open311 spec)
        client.setApiKey(UUID.randomUUID().toString());
        client.setContactPerson(contactPerson);
        client.setContactMethod(contactMethod);

        client = clientRepository.save(client);

        // Return DTO with actual api_key (only time it is exposed)
        return toDto(client, true);
    }

    // -----------------------------------------------------------------------
    // GET
    // -----------------------------------------------------------------------

    /**
     * Get a single client. api_key is masked (not returned after initial create).
     */
    @Transactional(readOnly = true)
    public ClientDetailDto get(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new BusinessException("CLIENT_NOT_FOUND",
                        "Client not found: " + id, HttpStatus.NOT_FOUND));
        return toDto(client, false);
    }

    // -----------------------------------------------------------------------
    // LIST
    // -----------------------------------------------------------------------

    /**
     * List all clients. api_key is masked in each entry.
     */
    @Transactional(readOnly = true)
    public List<ClientDetailDto> list() {
        return clientRepository.findAll()
                .stream()
                .map(c -> toDto(c, false))
                .toList();
    }

    // -----------------------------------------------------------------------
    // UPDATE
    // -----------------------------------------------------------------------

    /**
     * Update mutable client fields. Existing api_key is preserved (never regenerated).
     */
    public ClientDetailDto update(Long id, UpdateClientRequest req) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new BusinessException("CLIENT_NOT_FOUND",
                        "Client not found: " + id, HttpStatus.NOT_FOUND));

        if (req.name() != null) {
            client.setName(req.name());
        }
        if (req.url() != null) {
            client.setUrl(req.url());
        }
        if (req.contactPersonId() != null) {
            Person person = personRepository.findById(req.contactPersonId())
                    .orElseThrow(() -> new BusinessException("PERSON_NOT_FOUND",
                            "Person not found: " + req.contactPersonId()));
            client.setContactPerson(person);
        }
        if (req.contactMethodId() != null) {
            ContactMethod contactMethod = contactMethodRepository.findById(req.contactMethodId())
                    .orElseThrow(() -> new BusinessException("CONTACT_METHOD_NOT_FOUND",
                            "Contact method not found: " + req.contactMethodId()));
            client.setContactMethod(contactMethod);
        }

        client = clientRepository.save(client);
        // api_key masked on update response (T-04-22)
        return toDto(client, false);
    }

    // -----------------------------------------------------------------------
    // DELETE
    // -----------------------------------------------------------------------

    /**
     * Delete a client by ID.
     */
    public void delete(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new BusinessException("CLIENT_NOT_FOUND",
                        "Client not found: " + id, HttpStatus.NOT_FOUND));
        clientRepository.delete(client);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Map Client entity to ClientDetailDto.
     *
     * @param exposeApiKey true on create (api_key returned once); false for all other operations
     */
    private ClientDetailDto toDto(Client client, boolean exposeApiKey) {
        // api_key only exposed on create; masked (null) on all other responses (T-04-22)
        String apiKey = exposeApiKey ? client.getApiKey() : null;

        ContactRef personRef = null;
        if (client.getContactPerson() != null) {
            Person p = client.getContactPerson();
            String name = ((p.getFirstname() != null ? p.getFirstname() : "")
                    + " " + (p.getLastname() != null ? p.getLastname() : "")).trim();
            personRef = new ContactRef(p.getId(), name);
        }

        ContactRef methodRef = null;
        if (client.getContactMethod() != null) {
            ContactMethod m = client.getContactMethod();
            methodRef = new ContactRef(m.getId(), m.getName());
        }

        return new ClientDetailDto(
                client.getId(),
                client.getName(),
                client.getUrl(),
                apiKey,
                personRef,
                methodRef
        );
    }
}
