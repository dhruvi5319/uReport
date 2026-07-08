package com.ureport.admin.service;

import com.ureport.admin.dto.IssueTypeDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.IssueType;
import com.ureport.repository.IssueTypeRepository;
import com.ureport.repository.TicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class IssueTypeService {

    /**
     * IDs seeded by Flyway V1 migration — cannot be deleted.
     * 1=Comment, 2=Complaint, 3=Question, 4=Report, 5=Request, 6=Violation
     */
    private static final Set<Long> SEEDED_ISSUE_TYPE_IDS = Set.of(1L, 2L, 3L, 4L, 5L, 6L);

    private final IssueTypeRepository issueTypeRepository;
    private final TicketRepository ticketRepository;

    public IssueTypeService(IssueTypeRepository issueTypeRepository, TicketRepository ticketRepository) {
        this.issueTypeRepository = issueTypeRepository;
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public List<IssueTypeDto> listIssueTypes() {
        return issueTypeRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public IssueTypeDto createIssueType(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("INVALID_INPUT", "name is required", HttpStatus.BAD_REQUEST);
        }
        IssueType it = new IssueType();
        it.setName(name);
        return toDto(issueTypeRepository.save(it));
    }

    public IssueTypeDto updateIssueType(Long id, String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("INVALID_INPUT", "name is required", HttpStatus.BAD_REQUEST);
        }
        IssueType it = issueTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Issue type not found: " + id, HttpStatus.NOT_FOUND));
        it.setName(name);
        return toDto(issueTypeRepository.save(it));
    }

    public void deleteIssueType(Long id) {
        if (SEEDED_ISSUE_TYPE_IDS.contains(id)) {
            throw new BusinessException(
                    "SEEDED_RECORD_PROTECTED",
                    "System issue type cannot be deleted",
                    HttpStatus.FORBIDDEN);
        }
        if (ticketRepository.existsByIssueTypeId(id)) {
            throw new BusinessException(
                    "ISSUE_TYPE_IN_USE",
                    "Issue type is referenced by tickets",
                    HttpStatus.CONFLICT);
        }
        IssueType it = issueTypeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Issue type not found: " + id, HttpStatus.NOT_FOUND));
        issueTypeRepository.delete(it);
    }

    private IssueTypeDto toDto(IssueType it) {
        return new IssueTypeDto(it.getId(), it.getName());
    }
}
