package com.ureport.service;

import com.ureport.entity.CategoryActionResponse;
import com.ureport.entity.PeopleEmail;
import com.ureport.entity.TicketHistory;
import com.ureport.repository.CategoryActionResponseRepository;
import com.ureport.repository.PeopleEmailRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.repository.TicketRepository;
import com.ureport.util.TemplateVariableResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final PeopleEmailRepository peopleEmailRepository;
    private final CategoryActionResponseRepository carRepository;
    private final TicketHistoryRepository ticketHistoryRepository;
    private final TicketRepository ticketRepository;
    private final TemplateVariableResolver templateVariableResolver;
    private final JavaMailSender mailSender;

    @Autowired
    public NotificationService(PeopleEmailRepository peopleEmailRepository,
                                CategoryActionResponseRepository carRepository,
                                TicketHistoryRepository ticketHistoryRepository,
                                TicketRepository ticketRepository,
                                TemplateVariableResolver templateVariableResolver,
                                JavaMailSender mailSender) {
        this.peopleEmailRepository = peopleEmailRepository;
        this.carRepository = carRepository;
        this.ticketHistoryRepository = ticketHistoryRepository;
        this.ticketRepository = ticketRepository;
        this.templateVariableResolver = templateVariableResolver;
        this.mailSender = mailSender;
    }

    /**
     * Render a template string with variable substitution.
     */
    public String renderTemplate(String template, Map<String, Object> vars) {
        return templateVariableResolver.resolve(template, vars);
    }

    /**
     * Send an email via JavaMailSender.
     */
    public void sendEmail(String to, String replyTo, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            if (replyTo != null && !replyTo.isBlank()) {
                message.setReplyTo(replyTo);
            }
            message.setSubject(subject != null ? subject : "uReport Notification");
            message.setText(body != null ? body : "");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Process pending notifications for a ticketHistory entry.
     * Finds notification emails, renders template, sends email, updates sentNotifications.
     */
    public void processPendingNotifications(TicketHistory entry) {
        // Load the ticket to get reportedByPerson_id and category_id
        var ticketOpt = ticketRepository.findById(entry.getTicketId());
        if (ticketOpt.isEmpty()) {
            log.warn("Ticket not found for history entry {}: ticket_id={}", entry.getId(), entry.getTicketId());
            return;
        }
        var ticket = ticketOpt.get();

        // Find notification emails for the reporter
        Integer reporterId = ticket.getReportedByPersonId();
        if (reporterId == null) {
            // No reporter — update sentNotifications to empty string to prevent reprocessing
            entry.setSentNotifications("");
            ticketHistoryRepository.save(entry);
            return;
        }

        List<PeopleEmail> notifEmails = peopleEmailRepository
                .findByPersonIdAndUsedForNotificationsTrue(reporterId);

        if (notifEmails.isEmpty()) {
            entry.setSentNotifications("");
            ticketHistoryRepository.save(entry);
            return;
        }

        // Resolve template for this category + action
        String template = null;
        String replyEmail = null;

        // Look up category_action_responses for category_id + action_id
        Integer categoryId = ticket.getCategoryId();
        Integer actionId = entry.getActionId();
        Optional<CategoryActionResponse> carOpt = carRepository.findByCategoryIdAndActionId(categoryId, actionId);
        if (carOpt.isPresent()) {
            CategoryActionResponse car = carOpt.get();
            if (car.getTemplate() != null && !car.getTemplate().isBlank()) {
                template = car.getTemplate();
            }
            replyEmail = car.getReplyEmail();
        }

        // Build context for template rendering
        Map<String, Object> context = new HashMap<>();
        context.put("ticketId", String.valueOf(entry.getTicketId()));
        if (entry.getNotes() != null) {
            context.put("notes", entry.getNotes());
        }

        String renderedBody = template != null
                ? renderTemplate(template, context)
                : "Your service request #" + entry.getTicketId() + " has been updated.";

        // Send email to each notification address
        List<String> sentTo = new ArrayList<>();
        for (PeopleEmail email : notifEmails) {
            sendEmail(email.getEmail(), replyEmail, "uReport Notification - Ticket #" + entry.getTicketId(), renderedBody);
            sentTo.add(email.getEmail());
        }

        // Update sentNotifications
        String sentNotifications = String.join(",", sentTo);
        entry.setSentNotifications(sentNotifications);
        ticketHistoryRepository.save(entry);
    }
}
