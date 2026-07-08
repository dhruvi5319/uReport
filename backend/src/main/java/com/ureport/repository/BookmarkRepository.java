package com.ureport.repository;

import com.ureport.domain.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Bookmark entities.
 *
 * All queries are scoped by personId to enforce ownership (T-06-02).
 * findByPersonId ensures no cross-user data leakage.
 */
@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    /**
     * Returns all bookmarks belonging to the given person.
     * Used by GET /api/bookmarks — scoped to JWT personId.
     */
    List<Bookmark> findByPersonId(Long personId);

    /**
     * Returns a bookmark only if it belongs to the specified person.
     * Returns empty Optional if the bookmark exists but is owned by someone else.
     */
    Optional<Bookmark> findByIdAndPersonId(Long id, Long personId);
}
