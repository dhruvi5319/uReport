package com.ureport.service;

import com.ureport.dto.request.CreateSubstatusRequest;
import com.ureport.dto.request.UpdateSubstatusRequest;
import com.ureport.dto.response.SubstatusResponse;
import com.ureport.entity.Substatus;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.SubstatusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubstatusService {

    private static final Set<String> VALID_STATUSES = Set.of("open", "closed");

    private final SubstatusRepository substatusRepository;

    public SubstatusService(SubstatusRepository substatusRepository) {
        this.substatusRepository = substatusRepository;
    }

    /**
     * Creates a new substatus. Validates status is 'open' or 'closed'.
     */
    public SubstatusResponse createSubstatus(CreateSubstatusRequest req) {
        validateStatus(req.getStatus());

        Substatus substatus = new Substatus();
        substatus.setName(req.getName());
        substatus.setDescription(req.getDescription());
        substatus.setStatus(req.getStatus());
        substatus.setIsDefault(req.getIsDefault() != null && req.getIsDefault());
        substatus.setIsSystem(false);

        substatus = substatusRepository.save(substatus);
        return toResponse(substatus);
    }

    @Transactional(readOnly = true)
    public List<SubstatusResponse> listSubstatuses() {
        return substatusRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates a substatus. If isDefault=true, clears previous default for the same status.
     * Both operations occur in the same @Transactional method.
     */
    public SubstatusResponse updateSubstatus(Integer id, UpdateSubstatusRequest req) {
        Substatus substatus = loadSubstatus(id);

        if (req.getName() != null) substatus.setName(req.getName());
        if (req.getDescription() != null) substatus.setDescription(req.getDescription());
        if (req.getStatus() != null) {
            validateStatus(req.getStatus());
            substatus.setStatus(req.getStatus());
        }

        // Handle default enforcement: only one isDefault per status at a time
        if (req.getIsDefault() != null && req.getIsDefault()) {
            // Clear previous default for this status
            Optional<Substatus> previousDefault = substatusRepository
                    .findByStatusAndIsDefaultTrue(substatus.getStatus());
            if (previousDefault.isPresent() && !previousDefault.get().getId().equals(id)) {
                Substatus prev = previousDefault.get();
                prev.setIsDefault(false);
                substatusRepository.save(prev);
            }
            substatus.setIsDefault(true);
        } else if (req.getIsDefault() != null) {
            substatus.setIsDefault(false);
        }

        substatus = substatusRepository.save(substatus);
        return toResponse(substatus);
    }

    /**
     * Hard-deletes a substatus. Rejects isSystem=true records.
     */
    public void deleteSubstatus(Integer id) {
        Substatus substatus = loadSubstatus(id);
        if (substatus.isSystem()) {
            throw new ValidationException("SYSTEM_SUBSTATUS_NOT_DELETABLE",
                    "System substatuses cannot be deleted");
        }
        substatusRepository.deleteById(id);
    }

    /**
     * Returns the default substatus for a given status type.
     * Used by TicketService (wave 2a) for reopenTicket() and createTicket().
     */
    @Transactional(readOnly = true)
    public Substatus getDefaultSubstatusForStatus(String status) {
        return substatusRepository.findByStatusAndIsDefaultTrue(status)
                .orElseThrow(() -> new NotFoundException("SUBSTATUS_NOT_FOUND",
                        "No default substatus found for status: " + status));
    }

    // ---- Private helpers ----

    private Substatus loadSubstatus(Integer id) {
        return substatusRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("SUBSTATUS_NOT_FOUND",
                        "Substatus not found: " + id));
    }

    private void validateStatus(String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new ValidationException("INVALID_STATUS",
                    "Status must be 'open' or 'closed'. Got: " + status);
        }
    }

    public SubstatusResponse toResponse(Substatus substatus) {
        SubstatusResponse resp = new SubstatusResponse();
        resp.setId(substatus.getId());
        resp.setName(substatus.getName());
        resp.setDescription(substatus.getDescription());
        resp.setStatus(substatus.getStatus());
        resp.setIsDefault(substatus.getIsDefault());
        resp.setIsSystem(substatus.getIsSystem());
        return resp;
    }
}
