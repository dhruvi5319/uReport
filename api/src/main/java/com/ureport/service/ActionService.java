package com.ureport.service;

import com.ureport.dto.request.CreateActionRequest;
import com.ureport.dto.request.UpdateActionRequest;
import com.ureport.dto.response.ActionResponse;
import com.ureport.entity.Action;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.ActionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ActionService {

    private final ActionRepository actionRepository;

    public ActionService(ActionRepository actionRepository) {
        this.actionRepository = actionRepository;
    }

    /**
     * Creates a new action. Type MUST be 'department'.
     * System actions cannot be created via this API.
     */
    public ActionResponse createAction(CreateActionRequest req) {
        if (!"department".equals(req.getType())) {
            throw new ValidationException("INVALID_ACTION_TYPE",
                    "Only 'department' type actions can be created. Got: " + req.getType());
        }

        Action action = new Action();
        action.setName(req.getName());
        action.setDescription(req.getDescription());
        action.setType("department");
        action.setTemplate(req.getTemplate());
        action.setReplyEmail(req.getReplyEmail());

        action = actionRepository.save(action);
        return toResponse(action);
    }

    @Transactional(readOnly = true)
    public List<ActionResponse> listActions() {
        return actionRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Updates an action. Rejects system actions (type='system').
     */
    public ActionResponse updateAction(Integer id, UpdateActionRequest req) {
        Action action = loadAction(id);
        if ("system".equals(action.getType())) {
            throw new PermissionDeniedException("PERMISSION_DENIED",
                    "System actions cannot be modified");
        }

        if (req.getName() != null) action.setName(req.getName());
        if (req.getDescription() != null) action.setDescription(req.getDescription());
        if (req.getTemplate() != null) action.setTemplate(req.getTemplate());
        if (req.getReplyEmail() != null) action.setReplyEmail(req.getReplyEmail());

        action = actionRepository.save(action);
        return toResponse(action);
    }

    /**
     * Deletes an action. Rejects system actions (isSystem=true or type='system').
     */
    public void deleteAction(Integer id) {
        Action action = loadAction(id);
        if ("system".equals(action.getType())) {
            throw new PermissionDeniedException("PERMISSION_DENIED",
                    "System actions cannot be deleted");
        }
        actionRepository.deleteById(id);
    }

    // ---- Private helpers ----

    private Action loadAction(Integer id) {
        return actionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("ACTION_NOT_FOUND",
                        "Action not found: " + id));
    }

    public ActionResponse toResponse(Action action) {
        ActionResponse resp = new ActionResponse();
        resp.setId(action.getId());
        resp.setName(action.getName());
        resp.setDescription(action.getDescription());
        resp.setType(action.getType());
        resp.setTemplate(action.getTemplate());
        resp.setReplyEmail(action.getReplyEmail());
        return resp;
    }
}
