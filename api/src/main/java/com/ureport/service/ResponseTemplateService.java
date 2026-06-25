package com.ureport.service;

import com.ureport.entity.ResponseTemplate;
import com.ureport.exception.NotFoundException;
import com.ureport.repository.ActionRepository;
import com.ureport.repository.ResponseTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ResponseTemplateService {

    private final ResponseTemplateRepository responseTemplateRepository;
    private final ActionRepository actionRepository;

    @Autowired
    public ResponseTemplateService(ResponseTemplateRepository responseTemplateRepository,
                                    ActionRepository actionRepository) {
        this.responseTemplateRepository = responseTemplateRepository;
        this.actionRepository = actionRepository;
    }

    /**
     * List templates. If actionId provided, filter by action_id; else return all.
     */
    @Transactional(readOnly = true)
    public List<ResponseTemplate> listTemplates(Integer actionId) {
        if (actionId != null) {
            return responseTemplateRepository.findByActionId(actionId);
        }
        return responseTemplateRepository.findAll();
    }

    /**
     * Get a single template by ID.
     */
    @Transactional(readOnly = true)
    public ResponseTemplate getTemplate(Integer id) {
        return responseTemplateRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TEMPLATE_NOT_FOUND",
                        "Response template not found: " + id));
    }

    /**
     * Create a new response template.
     * Validates action_id exists if provided.
     */
    public ResponseTemplate createTemplate(String name, String template, Integer actionId) {
        if (actionId != null) {
            actionRepository.findById(actionId)
                    .orElseThrow(() -> new NotFoundException("ACTION_NOT_FOUND",
                            "Action not found: " + actionId));
        }

        ResponseTemplate rt = new ResponseTemplate();
        rt.setName(name);
        rt.setTemplate(template);
        rt.setActionId(actionId);
        return responseTemplateRepository.save(rt);
    }

    /**
     * Update a response template.
     */
    public ResponseTemplate updateTemplate(Integer id, String name, String template, Integer actionId) {
        ResponseTemplate rt = getTemplate(id);

        if (actionId != null) {
            actionRepository.findById(actionId)
                    .orElseThrow(() -> new NotFoundException("ACTION_NOT_FOUND",
                            "Action not found: " + actionId));
        }

        if (name != null) rt.setName(name);
        if (template != null) rt.setTemplate(template);
        rt.setActionId(actionId); // Allow clearing action_id with null
        return responseTemplateRepository.save(rt);
    }

    /**
     * Delete a response template.
     */
    public void deleteTemplate(Integer id) {
        if (!responseTemplateRepository.existsById(id)) {
            throw new NotFoundException("TEMPLATE_NOT_FOUND", "Response template not found: " + id);
        }
        responseTemplateRepository.deleteById(id);
    }
}
