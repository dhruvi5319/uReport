package com.ureport.admin.service;

import com.ureport.admin.dto.ContactMethodDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.ContactMethod;
import com.ureport.repository.ContactMethodRepository;
import com.ureport.repository.TicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContactMethodService {

    /**
     * IDs seeded by Flyway V1 migration — cannot be deleted.
     * 1=Email, 2=Phone, 3=Web Form, 4=Other
     */
    private static final Set<Long> SEEDED_CONTACT_METHOD_IDS = Set.of(1L, 2L, 3L, 4L);

    private final ContactMethodRepository contactMethodRepository;
    private final TicketRepository ticketRepository;

    public ContactMethodService(ContactMethodRepository contactMethodRepository, TicketRepository ticketRepository) {
        this.contactMethodRepository = contactMethodRepository;
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public List<ContactMethodDto> listContactMethods() {
        return contactMethodRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ContactMethodDto createContactMethod(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("INVALID_INPUT", "name is required", HttpStatus.BAD_REQUEST);
        }
        ContactMethod cm = new ContactMethod();
        cm.setName(name);
        return toDto(contactMethodRepository.save(cm));
    }

    public ContactMethodDto updateContactMethod(Long id, String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("INVALID_INPUT", "name is required", HttpStatus.BAD_REQUEST);
        }
        ContactMethod cm = contactMethodRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Contact method not found: " + id, HttpStatus.NOT_FOUND));
        cm.setName(name);
        return toDto(contactMethodRepository.save(cm));
    }

    public void deleteContactMethod(Long id) {
        if (SEEDED_CONTACT_METHOD_IDS.contains(id)) {
            throw new BusinessException(
                    "SEEDED_RECORD_PROTECTED",
                    "System contact method cannot be deleted",
                    HttpStatus.FORBIDDEN);
        }
        if (ticketRepository.existsByContactMethodId(id)) {
            throw new BusinessException(
                    "CONTACT_METHOD_IN_USE",
                    "Contact method is referenced by tickets",
                    HttpStatus.CONFLICT);
        }
        ContactMethod cm = contactMethodRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Contact method not found: " + id, HttpStatus.NOT_FOUND));
        contactMethodRepository.delete(cm);
    }

    private ContactMethodDto toDto(ContactMethod cm) {
        return new ContactMethodDto(cm.getId(), cm.getName());
    }
}
