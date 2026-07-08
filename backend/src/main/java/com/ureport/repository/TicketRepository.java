package com.ureport.repository;

import com.ureport.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    // -----------------------------------------------------------------------
    // Full-text search native queries (Phase 6 — search_vector GIN index)
    // -----------------------------------------------------------------------

    /**
     * FTS search without additional filters.
     * Orders by ts_rank_cd DESC, entered_date DESC.
     * The search_vector column and GIN index were created in Phase 1 (Flyway V2).
     */
    @Query(value = """
            SELECT t.*,
                   ts_headline('english', t.description, plainto_tsquery('english', :q),
                       'MaxWords=30, MinWords=10, StartSel=<mark>, StopSel=</mark>, HighlightAll=false')
                       AS search_snippet,
                   ts_rank_cd(t.search_vector, plainto_tsquery('english', :q)) AS rank
            FROM tickets t
            WHERE t.search_vector @@ plainto_tsquery('english', :q)
            ORDER BY rank DESC, t.entered_date DESC
            LIMIT :pageSize OFFSET :offset
            """, nativeQuery = true)
    List<Object[]> searchTickets(@Param("q") String q,
                                 @Param("pageSize") int pageSize,
                                 @Param("offset") int offset);

    /**
     * FTS combined with optional status and categoryId filters.
     * Pass null for either filter to ignore it.
     * Orders by ts_rank_cd DESC, entered_date DESC.
     */
    @Query(value = """
            SELECT t.*,
                   ts_headline('english', t.description, plainto_tsquery('english', :q),
                       'MaxWords=30, MinWords=10, StartSel=<mark>, StopSel=</mark>, HighlightAll=false')
                       AS search_snippet,
                   ts_rank_cd(t.search_vector, plainto_tsquery('english', :q)) AS rank
            FROM tickets t
            WHERE t.search_vector @@ plainto_tsquery('english', :q)
              AND (:status IS NULL OR t.status = :status)
              AND (:categoryId IS NULL OR t.category_id = :categoryId)
            ORDER BY rank DESC, t.entered_date DESC
            LIMIT :pageSize OFFSET :offset
            """, nativeQuery = true)
    List<Object[]> searchTicketsWithFilters(@Param("q") String q,
                                            @Param("status") String status,
                                            @Param("categoryId") Long categoryId,
                                            @Param("pageSize") int pageSize,
                                            @Param("offset") int offset);

    /**
     * Count for pagination when FTS is active (with optional status/categoryId filters).
     */
    @Query(value = """
            SELECT COUNT(*) FROM tickets t
            WHERE t.search_vector @@ plainto_tsquery('english', :q)
              AND (:status IS NULL OR t.status = :status)
              AND (:categoryId IS NULL OR t.category_id = :categoryId)
            """, nativeQuery = true)
    long countSearchTickets(@Param("q") String q,
                            @Param("status") String status,
                            @Param("categoryId") Long categoryId);

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
