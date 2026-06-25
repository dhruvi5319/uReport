package com.ureport.service;

import com.ureport.dto.request.CreateActionRequest;
import com.ureport.dto.request.UpdateActionRequest;
import com.ureport.dto.response.ActionResponse;
import com.ureport.entity.Action;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.ActionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionServiceTest {

    @Mock
    private ActionRepository actionRepository;

    @InjectMocks
    private ActionService actionService;

    private Action buildAction(Integer id, String name, String type) {
        Action a = new Action();
        a.setId(id);
        a.setName(name);
        a.setType(type);
        return a;
    }

    @Test
    void createAction_withSystemType_throws422() {
        CreateActionRequest req = new CreateActionRequest();
        req.setName("System Action");
        req.setType("system"); // not allowed

        assertThatThrownBy(() -> actionService.createAction(req))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("INVALID_ACTION_TYPE");
    }

    @Test
    void createAction_withDepartmentType_succeeds() {
        CreateActionRequest req = new CreateActionRequest();
        req.setName("Custom Action");
        req.setType("department");

        Action saved = buildAction(1, "Custom Action", "department");
        when(actionRepository.save(any(Action.class))).thenReturn(saved);

        ActionResponse resp = actionService.createAction(req);

        assertThat(resp.getType()).isEqualTo("department");
        assertThat(resp.getId()).isEqualTo(1);
    }

    @Test
    void deleteAction_systemAction_throws403() {
        Action systemAction = buildAction(1, "Open Ticket", "system");
        when(actionRepository.findById(1)).thenReturn(Optional.of(systemAction));

        assertThatThrownBy(() -> actionService.deleteAction(1))
                .isInstanceOf(PermissionDeniedException.class)
                .hasMessageContaining("PERMISSION_DENIED");
    }

    @Test
    void updateAction_systemAction_throws403() {
        Action systemAction = buildAction(2, "Close Ticket", "system");
        when(actionRepository.findById(2)).thenReturn(Optional.of(systemAction));

        UpdateActionRequest req = new UpdateActionRequest();
        req.setName("Modified Name");

        assertThatThrownBy(() -> actionService.updateAction(2, req))
                .isInstanceOf(PermissionDeniedException.class)
                .hasMessageContaining("PERMISSION_DENIED");
    }

    @Test
    void deleteAction_departmentAction_succeeds() {
        Action deptAction = buildAction(5, "Custom Close", "department");
        when(actionRepository.findById(5)).thenReturn(Optional.of(deptAction));

        actionService.deleteAction(5);

        verify(actionRepository).deleteById(5);
    }

    @Test
    void listActions_returnsAll() {
        Action a1 = buildAction(1, "Open", "system");
        Action a2 = buildAction(2, "Custom", "department");
        when(actionRepository.findAll()).thenReturn(List.of(a1, a2));

        List<ActionResponse> results = actionService.listActions();

        assertThat(results).hasSize(2);
    }
}
