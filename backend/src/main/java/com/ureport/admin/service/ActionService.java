package com.ureport.admin.service;

import com.ureport.admin.dto.CreateActionRequest;
import com.ureport.admin.dto.UpdateActionRequest;
import com.ureport.crm.dto.ActionDto;
import com.ureport.crm.exception.BusinessException;
import com.ureport.domain.Action;
import com.ureport.repository.ActionsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ActionService {

    private final ActionsRepository actionsRepository;

    public ActionService(ActionsRepository actionsRepository) {
        this.actionsRepository = actionsRepository;
    }

    @Transactional(readOnly = true)
    public List<ActionDto> listActions() {
        return actionsRepository.findAllByOrderByTypeAscNameAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ActionDto createAction(CreateActionRequest req) {
        Action action = new Action();
        action.setName(req.name);
        action.setDescription(req.description);
        action.setTemplate(req.template);
        action.setReplyEmail(req.replyEmail);
        // Always create as department — client cannot set system type
        action.setType("department");
        return toDto(actionsRepository.save(action));
    }

    public ActionDto updateAction(Long id, UpdateActionRequest req) {
        Action action = actionsRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Action not found: " + id, HttpStatus.NOT_FOUND));
        // Update ONLY template and replyEmail — name, description, and type are immutable via this endpoint
        action.setTemplate(req.template);
        action.setReplyEmail(req.replyEmail);
        return toDto(actionsRepository.save(action));
    }

    public void deleteAction(Long id) {
        Action action = actionsRepository.findById(id)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Action not found: " + id, HttpStatus.NOT_FOUND));
        if ("system".equals(action.getType())) {
            throw new BusinessException(
                    "SYSTEM_ACTION_PROTECTED",
                    "System actions cannot be deleted",
                    HttpStatus.FORBIDDEN);
        }
        actionsRepository.delete(action);
    }

    private ActionDto toDto(Action action) {
        return new ActionDto(
                action.getId(),
                action.getName(),
                action.getReplyEmail(),
                "department".equals(action.getType()));
    }
}
