package com.ureport.service;

import com.ureport.exception.ValidationException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MetricsServiceTest {

    @Mock
    private EntityManager entityManager;

    private MetricsService metricsService;

    @BeforeEach
    void setUp() {
        metricsService = new MetricsService();
        try {
            var field = MetricsService.class.getDeclaredField("entityManager");
            field.setAccessible(true);
            field.set(metricsService, entityManager);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testGetOnTimePercentage_allOnTime() {
        // Arrange
        Integer categoryId = 1;
        Integer numDays = 30;
        LocalDate effectiveDate = LocalDate.now();

        Query catQuery = mock(Query.class);
        Query totalQuery = mock(Query.class);
        Query onTimeQuery = mock(Query.class);

        when(entityManager.createNativeQuery(contains("categories WHERE id"))).thenReturn(catQuery);
        when(catQuery.setParameter(anyString(), any())).thenReturn(catQuery);
        when(catQuery.getSingleResult()).thenReturn(new Object[]{"Test Category", 10});

        when(entityManager.createNativeQuery(contains("COUNT(*) FROM tickets") + anyString())).thenAnswer(inv -> {
            String sql = inv.getArgument(0);
            if (sql.contains("COUNT(*) FROM tickets")) return totalQuery;
            return onTimeQuery;
        });

        // Use a simpler approach — mock all native queries consistently
        when(entityManager.createNativeQuery(anyString())).thenAnswer(inv -> {
            String sql = inv.getArgument(0);
            if (sql.contains("categories WHERE id")) {
                Query q = mock(Query.class);
                when(q.setParameter(anyString(), any())).thenReturn(q);
                when(q.getSingleResult()).thenReturn(new Object[]{"Category 1", 10});
                return q;
            } else if (sql.contains("COUNT(*) FROM tickets") && !sql.contains("closedDate <=")) {
                Query q = mock(Query.class);
                when(q.setParameter(anyString(), any())).thenReturn(q);
                when(q.getSingleResult()).thenReturn(5L);
                return q;
            } else if (sql.contains("closedDate <=")) {
                Query q = mock(Query.class);
                when(q.setParameter(anyString(), any())).thenReturn(q);
                when(q.getSingleResult()).thenReturn(5L); // all on time
                return q;
            }
            Query q = mock(Query.class);
            when(q.setParameter(anyString(), any())).thenReturn(q);
            when(q.getResultList()).thenReturn(List.of());
            return q;
        });

        // Act
        Map<String, Object> result = metricsService.getOnTimePercentage(categoryId, numDays, effectiveDate);

        // Assert
        assertNotNull(result);
        assertEquals(categoryId, result.get("category_id"));
        assertEquals(numDays, result.get("numDays"));
        assertNotNull(result.get("onTimePercentage"));
    }

    @Test
    void testGetOnTimePercentage_noneOnTime() {
        // Arrange
        when(entityManager.createNativeQuery(anyString())).thenAnswer(inv -> {
            String sql = inv.getArgument(0);
            Query q = mock(Query.class);
            when(q.setParameter(anyString(), any())).thenReturn(q);
            if (sql.contains("categories WHERE id")) {
                when(q.getSingleResult()).thenReturn(new Object[]{"Category X", 5});
            } else if (sql.contains("COUNT(*) FROM tickets") && !sql.contains("closedDate <=")) {
                when(q.getSingleResult()).thenReturn(10L); // 10 closed tickets
            } else if (sql.contains("closedDate <=")) {
                when(q.getSingleResult()).thenReturn(0L); // none on time
            } else {
                when(q.getResultList()).thenReturn(List.of());
            }
            return q;
        });

        // Act
        Map<String, Object> result = metricsService.getOnTimePercentage(1, 30, LocalDate.now());

        // Assert
        assertNotNull(result);
        // onTimePercentage should be 0.0 since 0/10 were on time
        double pct = ((Number) result.get("onTimePercentage")).doubleValue();
        assertEquals(0.0, pct);
    }

    @Test
    void testGetReport_invalidType_throws() {
        // Act & Assert
        ValidationException ex = assertThrows(ValidationException.class,
                () -> metricsService.getReport("invalid_type", Map.of()));

        assertEquals("INVALID_REPORT_TYPE", ex.getErrorCode());
    }

    @Test
    void testGetReport_activity_returnsData() {
        // Arrange
        when(entityManager.createNativeQuery(anyString())).thenAnswer(inv -> {
            Query q = mock(Query.class);
            when(q.setParameter(anyString(), any())).thenReturn(q);
            when(q.getResultList()).thenReturn(List.of(
                    new Object[]{"2024-01-01", 5L, 3L},
                    new Object[]{"2024-01-02", 8L, 4L}
            ));
            return q;
        });

        // Act
        Map<String, Object> result = metricsService.getReport("activity",
                Map.of("startDate", "2024-01-01", "endDate", "2024-01-31"));

        // Assert
        assertNotNull(result);
        assertEquals("activity", result.get("reportType"));
        assertNotNull(result.get("generatedAt"));
        assertNotNull(result.get("data"));
        List<?> data = (List<?>) result.get("data");
        assertEquals(2, data.size());
    }

    @Test
    void testGetReport_validTypes_doNotThrow() {
        // All 10 valid types should not throw ValidationException
        when(entityManager.createNativeQuery(anyString())).thenAnswer(inv -> {
            Query q = mock(Query.class);
            when(q.setParameter(anyString(), any())).thenReturn(q);
            when(q.getResultList()).thenReturn(List.of());
            return q;
        });

        for (String type : List.of("activity", "assignments", "categories", "staff",
                "sla", "volume", "current", "opened", "closed")) {
            assertDoesNotThrow(() -> metricsService.getReport(type, Map.of()));
        }

        // "person" requires person_id — no results without it
        assertDoesNotThrow(() -> metricsService.getReport("person", Map.of("person_id", "1")));
    }
}
