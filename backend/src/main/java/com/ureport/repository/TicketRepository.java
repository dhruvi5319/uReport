package com.ureport.repository;

import com.ureport.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    /**
     * Checks if a person is referenced by any ticket (as entered-by, reported-by, or assigned).
     * Used to enforce delete safety: a person referenced by tickets cannot be deleted.
     */
    boolean existsByEnteredByPersonIdOrReportedByPersonIdOrAssignedPersonId(
        Long enteredByPersonId, Long reportedByPersonId, Long assignedPersonId);

    /**
     * Checks if an issue type is referenced by any ticket.
     * Used by IssueTypeService.deleteIssueType to prevent deletion of in-use types.
     */
    boolean existsByIssueTypeId(Long issueTypeId);

    /**
     * Checks if a contact method is referenced by any ticket.
     * Used by ContactMethodService.deleteContactMethod to prevent deletion of in-use methods.
     */
    boolean existsByContactMethodId(Long contactMethodId);

    /**
     * Find tickets where the given person is involved (entered-by, reported-by, or assigned).
     * Used by GET /api/people/{id}/tickets.
     */
    List<Ticket> findByEnteredByPersonIdOrReportedByPersonIdOrAssignedPersonId(
        Long enteredByPersonId, Long reportedByPersonId, Long assignedPersonId);

    /**
     * Checks if a category is referenced by any ticket.
     * Used by CategoryService.deleteCategory to prevent deletion of in-use categories.
     */
    boolean existsByCategoryId(Long categoryId);
}
