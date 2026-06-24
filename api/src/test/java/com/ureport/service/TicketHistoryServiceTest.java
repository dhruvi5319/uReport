package com.ureport.service;

import com.ureport.dto.response.HistoryEntryResponse;
import com.ureport.entity.Action;
import com.ureport.entity.Person;
import com.ureport.entity.TicketHistory;
import com.ureport.repository.ActionRepository;
import com.ureport.repository.PersonRepository;
import com.ureport.repository.TicketHistoryRepository;
import com.ureport.util.TemplateVariableResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketHistoryServiceTest {

    @Mock
    private TicketHistoryRepository ticketHistoryRepository;

    @Mock
    private ActionRepository actionRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private TemplateVariableResolver templateVariableResolver;

    @InjectMocks
    private TicketHistoryService ticketHistoryService;

    private TicketHistory sampleHistory;
    private Action sampleAction;
    private Person samplePerson;

    @BeforeEach
    void setUp() {
        sampleHistory = new TicketHistory();
        sampleHistory.setTicketId(1L);
        sampleHistory.setActionId(1);
        sampleHistory.setEnteredByPersonId(10);
        sampleHistory.setEnteredDate(OffsetDateTime.now());
        sampleHistory.setActionDate(OffsetDateTime.now());

        sampleAction = new Action();
        sampleAction.setId(1);
        sampleAction.setName("open");
        sampleAction.setTemplate("Ticket opened by {enteredByPerson}");

        samplePerson = new Person();
        samplePerson.setId(10);
        samplePerson.setFirstname("John");
        samplePerson.setLastname("Doe");
    }

    @Test
    void testAppend_insertsImmutableRow() {
        when(ticketHistoryRepository.save(any(TicketHistory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        TicketHistory result = ticketHistoryService.append(1L, 1, 10, null, "Test note", null);

        assertThat(result).isNotNull();
        assertThat(result.getTicketId()).isEqualTo(1L);
        assertThat(result.getActionId()).isEqualTo(1);
        assertThat(result.getEnteredByPersonId()).isEqualTo(10);
        assertThat(result.getNotes()).isEqualTo("Test note");
        verify(ticketHistoryRepository).save(any(TicketHistory.class));
        // Verify NO update/delete methods called (immutable)
        verify(ticketHistoryRepository, never()).deleteById(any());
    }

    @Test
    void testGetHistory_orderedByEnteredDateAsc() {
        TicketHistory entry1 = new TicketHistory();
        entry1.setTicketId(1L);
        entry1.setActionId(1);
        entry1.setEnteredDate(OffsetDateTime.now().minusHours(2));

        TicketHistory entry2 = new TicketHistory();
        entry2.setTicketId(1L);
        entry2.setActionId(9);
        entry2.setEnteredDate(OffsetDateTime.now());

        when(ticketHistoryRepository.findByTicketIdOrderByEnteredDateAsc(1L))
                .thenReturn(List.of(entry1, entry2));
        when(actionRepository.findById(anyInt())).thenReturn(Optional.of(sampleAction));
        when(templateVariableResolver.resolve(anyString(), any())).thenReturn("rendered");

        List<HistoryEntryResponse> result = ticketHistoryService.getHistory(1L);

        assertThat(result).hasSize(2);
        // Verify they are in the order returned (already ordered by repository)
        assertThat(result.get(0).enteredDate()).isBefore(result.get(1).enteredDate());
    }

    @Test
    void testTemplateVariableResolution_enteredByPerson() {
        // Use actual TemplateVariableResolver for this test
        TemplateVariableResolver realResolver = new TemplateVariableResolver();
        TicketHistoryService service = new TicketHistoryService(
                ticketHistoryRepository, actionRepository, personRepository, realResolver);

        sampleHistory.setEnteredByPersonId(10);
        when(ticketHistoryRepository.findByTicketIdOrderByEnteredDateAsc(1L))
                .thenReturn(List.of(sampleHistory));
        when(actionRepository.findById(1)).thenReturn(Optional.of(sampleAction));
        when(personRepository.findById(10)).thenReturn(Optional.of(samplePerson));

        List<HistoryEntryResponse> result = service.getHistory(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).renderedDescription()).contains("John Doe");
    }

    @Test
    void testTemplateVariableResolution_originalField() {
        TemplateVariableResolver realResolver = new TemplateVariableResolver();
        TicketHistoryService service = new TicketHistoryService(
                ticketHistoryRepository, actionRepository, personRepository, realResolver);

        Action categoryChangeAction = new Action();
        categoryChangeAction.setId(4);
        categoryChangeAction.setName("changeCategory");
        categoryChangeAction.setTemplate("Category changed from {original:category_id} to {updated:category_id}");

        TicketHistory categoryHistory = new TicketHistory();
        categoryHistory.setTicketId(1L);
        categoryHistory.setActionId(4);
        categoryHistory.setData("{\"original\":{\"category_id\":5},\"updated\":{\"category_id\":12}}");
        categoryHistory.setEnteredDate(OffsetDateTime.now());

        when(ticketHistoryRepository.findByTicketIdOrderByEnteredDateAsc(1L))
                .thenReturn(List.of(categoryHistory));
        when(actionRepository.findById(4)).thenReturn(Optional.of(categoryChangeAction));

        List<HistoryEntryResponse> result = service.getHistory(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).renderedDescription())
                .contains("5")
                .contains("12");
    }

    @Test
    void testTemplateVariableResolution_unknownTokenPassthrough() {
        TemplateVariableResolver realResolver = new TemplateVariableResolver();

        Action unknownTokenAction = new Action();
        unknownTokenAction.setId(99);
        unknownTokenAction.setName("custom");
        unknownTokenAction.setTemplate("Action {unknownToken} happened");

        String result = realResolver.resolve("Action {unknownToken} happened",
                Map.of("enteredByPersonName", "John"));

        // Unknown token should be left as-is
        assertThat(result).isEqualTo("Action {unknownToken} happened");
    }
}
