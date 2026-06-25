package com.ureport.service;

import com.ureport.dto.request.UpdateSubstatusRequest;
import com.ureport.dto.response.SubstatusResponse;
import com.ureport.entity.Substatus;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.SubstatusRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubstatusServiceTest {

    @Mock
    private SubstatusRepository substatusRepository;

    @InjectMocks
    private SubstatusService substatusService;

    private Substatus buildSubstatus(Integer id, String name, String status, boolean isDefault, boolean isSystem) {
        Substatus s = new Substatus();
        s.setId(id);
        s.setName(name);
        s.setStatus(status);
        s.setIsDefault(isDefault);
        s.setIsSystem(isSystem);
        return s;
    }

    @Test
    void updateSubstatus_setDefault_clearsPreviousDefault() {
        Substatus target = buildSubstatus(2, "In Progress", "open", false, false);
        Substatus previousDefault = buildSubstatus(1, "New", "open", true, false);

        when(substatusRepository.findById(2)).thenReturn(Optional.of(target));
        when(substatusRepository.findByStatusAndIsDefaultTrue("open"))
                .thenReturn(Optional.of(previousDefault));
        when(substatusRepository.save(any(Substatus.class))).thenAnswer(i -> i.getArgument(0));

        UpdateSubstatusRequest req = new UpdateSubstatusRequest();
        req.setIsDefault(true);

        substatusService.updateSubstatus(2, req);

        // Previous default should be cleared
        verify(substatusRepository).save(argThat(s -> s.getId().equals(1) && !s.isDefault()));
        // Target should be set as default
        verify(substatusRepository).save(argThat(s -> s.getId().equals(2) && s.isDefault()));
    }

    @Test
    void deleteSubstatus_systemSubstatus_throws422() {
        Substatus systemSubstatus = buildSubstatus(3, "Duplicate", "closed", false, true);
        when(substatusRepository.findById(3)).thenReturn(Optional.of(systemSubstatus));

        assertThatThrownBy(() -> substatusService.deleteSubstatus(3))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("SYSTEM_SUBSTATUS_NOT_DELETABLE");
    }

    @Test
    void getDefaultSubstatusForStatus_returnsCorrectDefault() {
        Substatus defaultOpen = buildSubstatus(1, "New", "open", true, true);
        when(substatusRepository.findByStatusAndIsDefaultTrue("open"))
                .thenReturn(Optional.of(defaultOpen));

        Substatus result = substatusService.getDefaultSubstatusForStatus("open");

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.isDefault()).isTrue();
        assertThat(result.getStatus()).isEqualTo("open");
    }

    @Test
    void getDefaultSubstatusForStatus_noDefault_throwsNotFoundException() {
        when(substatusRepository.findByStatusAndIsDefaultTrue("closed"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> substatusService.getDefaultSubstatusForStatus("closed"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("SUBSTATUS_NOT_FOUND");
    }

    @Test
    void deleteSubstatus_nonSystemSubstatus_succeeds() {
        Substatus substatus = buildSubstatus(5, "Custom", "open", false, false);
        when(substatusRepository.findById(5)).thenReturn(Optional.of(substatus));

        substatusService.deleteSubstatus(5);

        verify(substatusRepository).deleteById(5);
    }
}
