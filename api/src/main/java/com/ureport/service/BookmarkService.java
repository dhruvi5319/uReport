package com.ureport.service;

import com.ureport.entity.Bookmark;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.repository.BookmarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;

    @Autowired
    public BookmarkService(BookmarkRepository bookmarkRepository) {
        this.bookmarkRepository = bookmarkRepository;
    }

    /**
     * Create a bookmark for the given person.
     */
    public Bookmark createBookmark(Integer personId, String name, String requestUri, String type) {
        Bookmark bookmark = new Bookmark();
        bookmark.setPersonId(personId);
        bookmark.setName(name);
        bookmark.setRequestUri(requestUri);
        bookmark.setType(type != null ? type : "search");
        return bookmarkRepository.save(bookmark);
    }

    /**
     * List all bookmarks for a person, ordered by createdAt DESC.
     */
    @Transactional(readOnly = true)
    public List<Bookmark> listBookmarks(Integer personId) {
        return bookmarkRepository.findByPersonIdOrderByCreatedAtDesc(personId);
    }

    /**
     * Delete a bookmark by ID.
     * Throws PermissionDeniedException if the caller is not the owner.
     * Throws NotFoundException if the bookmark does not exist.
     */
    public void deleteBookmark(Integer id, Integer personId) {
        Bookmark bookmark = bookmarkRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("BOOKMARK_NOT_FOUND",
                        "Bookmark not found: " + id));

        if (!bookmark.getPersonId().equals(personId)) {
            throw new PermissionDeniedException("PERMISSION_DENIED",
                    "You do not have permission to delete this bookmark");
        }

        bookmarkRepository.delete(bookmark);
    }
}
