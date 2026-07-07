package com.ureport.crm.service;

import com.ureport.domain.Action;
import com.ureport.domain.CategoryActionResponse;
import com.ureport.domain.Ticket;
import com.ureport.domain.TicketHistory;
import com.ureport.repository.ActionsRepository;
import com.ureport.repository.CategoryActionResponseRepository;
import com.ureport.repository.PeopleEmailRepository;
import com.ureport.repository.TicketRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * SMTP email dispatch service for ticket notifications.
 *
 * sendEmail() is ALWAYS non-fatal: MailException is caught and logged at WARN level.
 * Callers NEVER need to handle email-related exceptions.
 *
 * Security: T-04-15 (SMTP timeout), T-04-16 (staff-only endpoint prevents spam)
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final JavaMailSender javaMailSender;
    private final PeopleEmailRepository peopleEmailRepository;
    private final TicketRepository ticketRepository;
    private final ActionsRepository actionsRepository;
    private final CategoryActionResponseRepository categoryActionResponseRepository;

    @Value("${notification.reply-email:noreply@ureport.local}")
    private String defaultReplyEmail;

    public NotificationService(JavaMailSender javaMailSender,
                                PeopleEmailRepository peopleEmailRepository,
                                TicketRepository ticketRepository,
                                ActionsRepository actionsRepository,
                                CategoryActionResponseRepository categoryActionResponseRepository) {
        this.javaMailSender = javaMailSender;
        this.peopleEmailRepository = peopleEmailRepository;
        this.ticketRepository = ticketRepository;
        this.actionsRepository = actionsRepository;
        this.categoryActionResponseRepository = categoryActionResponseRepository;
    }

    /**
     * Returns all notification email addresses for a person.
     * Returns empty list if person has no notification emails configured.
     */
    public List<String> getNotificationEmails(Long personId) {
        if (personId == null) return List.of();
        return peopleEmailRepository.findByPersonIdAndUsedForNotificationsTrue(personId)
                .stream()
                .map(pe -> pe.getEmail())
                .toList();
    }

    /**
     * Resolves the reply-to email address for a given category+action pair.
     *
     * Priority order:
     * 1. CategoryActionResponse.reply_email (if present and non-blank)
     * 2. Action.reply_email (if present and non-blank)
     * 3. System default from notification.reply-email property
     */
    public String resolveReplyEmail(Long categoryId, Long actionId) {
        if (categoryId != null && actionId != null) {
            Optional<CategoryActionResponse> car =
                    categoryActionResponseRepository.findByCategoryIdAndActionId(categoryId, actionId);
            if (car.isPresent() && car.get().getReplyEmail() != null && !car.get().getReplyEmail().isBlank()) {
                return car.get().getReplyEmail();
            }
        }
        if (actionId != null) {
            Optional<Action> action = actionsRepository.findById(actionId);
            if (action.isPresent() && action.get().getReplyEmail() != null && !action.get().getReplyEmail().isBlank()) {
                return action.get().getReplyEmail();
            }
        }
        return defaultReplyEmail;
    }

    /**
     * Sends a single email. Non-fatal: MailException is caught and logged at WARN level.
     * NEVER re-throws. NEVER propagates failure to the caller.
     *
     * Security: T-04-15 — 5s timeout configured in application.properties prevents blocking.
     */
    public void sendEmail(String to, String subject, String body, String replyTo) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            if (replyTo != null && !replyTo.isBlank()) {
                message.setReplyTo(replyTo);
            }
            javaMailSender.send(message);
            log.debug("Email sent to {}: {}", to, subject);
        } catch (MailException e) {
            // Non-fatal: log warning only, never re-throw (T-04-15)
            log.warn("Email delivery failed to {}: {}", to, e.getMessage());
        }
    }

    /**
     * Dispatches ticket notifications to reporter and/or assignee.
     *
     * Returns the list of email addresses to which delivery was attempted.
     * (Not filtered by success — sendEmail is non-fatal; history records all attempted addresses.)
     *
     * Security: T-04-16 — This method is only called from TicketHistoryService.logAction which is
     * guarded by @PreAuthorize("hasAnyRole('STAFF','ADMIN')").
     */
    public List<String> sendTicketNotification(Long ticketId, TicketHistory historyEntry,
                                                boolean notifyReporter, boolean notifyAssignee) {
        List<String> sentTo = new ArrayList<>();

        Ticket ticket = ticketRepository.findById(ticketId).orElse(null);
        if (ticket == null) {
            log.warn("sendTicketNotification: ticket {} not found, skipping", ticketId);
            return sentTo;
        }

        Long categoryId = ticket.getCategory() != null ? ticket.getCategory().getId() : null;
        Long actionId = historyEntry.getActionId();
        String replyEmail = resolveReplyEmail(categoryId, actionId);

        // Build subject and body
        String categoryName = ticket.getCategory() != null ? ticket.getCategory().getName() : "General";
        Action action = actionId != null ? actionsRepository.findById(actionId).orElse(null) : null;
        String actionName = action != null ? action.getName() : "update";

        String subject = String.format("[Case #%d] %s: %s", ticketId, actionName, categoryName);
        String body = (historyEntry.getNotes() != null && !historyEntry.getNotes().isBlank())
                ? historyEntry.getNotes()
                : actionName;

        if (notifyReporter && ticket.getReportedByPerson() != null) {
            List<String> emails = getNotificationEmails(ticket.getReportedByPerson().getId());
            for (String email : emails) {
                sendEmail(email, subject, body, replyEmail);
                sentTo.add(email);
            }
        }

        if (notifyAssignee && ticket.getAssignedPerson() != null) {
            List<String> emails = getNotificationEmails(ticket.getAssignedPerson().getId());
            for (String email : emails) {
                sendEmail(email, subject, body, replyEmail);
                sentTo.add(email);
            }
        }

        return sentTo;
    }
}
