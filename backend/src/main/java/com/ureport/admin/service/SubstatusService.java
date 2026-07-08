package com.ureport.admin.service;

import com.ureport.admin.dto.CreateSubstatusRequest;
import com.ureport.admin.dto.SubstatusDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.Substatus;
import com.ureport.repository.SubstatusRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubstatusService {

    /**
     * IDs seeded by Flyway V1 migration — cannot be deleted.
     * 1=Resolved, 2=Duplicate, 3=Bogus
     */
    private static final Set<Long> SEEDED_SUBSTATUS_IDS = Set.of(1L, 2L, 3L);

    private final SubstatusRepository substatusRepository;

    public SubstatusService(SubstatusRepository substatusRepository) {
        this.substatusRepository = substatusRepository;
    }

    @Transactional(readOnly = true)
    public List<SubstatusDto> listSubstatuses() {
        return substatusRepository.findAllByOrderByStatusAscNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public SubstatusDto createSubstatus(CreateSubstatusRequest req) {
        validateStatus(req.status);
        if (req.isDefault) {
            clearDefaultForStatus(req.status);
        }
        Substatus s = new Substatus();
        s.setName(req.name);
        s.setDescription(req.description);
        s.setStatus(req.status);
        s.setIsDefault(req.isDefault);
        return toDto(substatusRepository.save(s));
    }

    public SubstatusDto updateSubstatus(Long id, CreateSubstatusRequest req) {
        Substatus s = substatusRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Substatus not found: " + id, HttpStatus.NOT_FOUND));
        validateStatus(req.status);
        if (req.isDefault) {
            clearDefaultForStatus(req.status);
            s.setIsDefault(true);
        } else {
            s.setIsDefault(false);
        }
        s.setName(req.name);
        s.setDescription(req.description);
        s.setStatus(req.status);
        return toDto(substatusRepository.save(s));
    }

    public void deleteSubstatus(Long id) {
        if (SEEDED_SUBSTATUS_IDS.contains(id)) {
            throw new BusinessException(
                    "SEEDED_RECORD_PROTECTED",
                    "System substatus cannot be deleted",
                    HttpStatus.FORBIDDEN);
        }
        Substatus s = substatusRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Substatus not found: " + id, HttpStatus.NOT_FOUND));
        substatusRepository.delete(s);
    }

    private void clearDefaultForStatus(String status) {
        substatusRepository.findByStatusAndIsDefaultTrue(status)
                .forEach(s -> {
                    s.setIsDefault(false);
                    substatusRepository.save(s);
                });
    }

    private void validateStatus(String status) {
        if (!"open".equals(status) && !"closed".equals(status)) {
            throw new BusinessException("INVALID_STATUS",
                    "Status must be 'open' or 'closed', got: " + status,
                    HttpStatus.BAD_REQUEST);
        }
    }

    private SubstatusDto toDto(Substatus s) {
        return new SubstatusDto(s.getId(), s.getName(), s.getDescription(), s.getStatus(), s.getIsDefault());
    }
}
