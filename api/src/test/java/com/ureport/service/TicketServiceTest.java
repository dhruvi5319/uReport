package com.ureport.service;

import com.ureport.dto.request.CloseTicketRequest;
import com.ureport.dto.request.CreateTicketRequest;
import com.ureport.entity.Category;
import com.ureport.entity.Substatus;
import com.ureport.entity.Ticket;
import com.ureport.entity.Person;
import com.ureport.exception.InvalidTransitionException;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.exception.ValidationException;
import com.ureport.repository.*;
import com.ureport.security.PermissionEvaluator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private TicketHistoryService ticketHistoryService;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubstatusRepository substatusRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private PeopleEmailRepository peopleEmailRepository;

    @Mock
    private PermissionEvaluator permissionEvaluator;

    @InjectMocks
    private TicketService ticketService;

    private Category activeCategory;
    private Substatus defaultOpenSubstatus;
    private Substatus closedSubstatus;

    @BeforeEach
    void setUp() {
        activeCategory = new Category();
        activeCategory.setId(1);
        activeCategory.setName("Test Category");
        activeCategory.setActive(true);
        activeCategory.setPostingPermissionLevel("anonymous");
        activeCategory.setDisplayPermissionLevel("anonymous");

        defaultOpenSubstatus = new Substatus();
        defaultOpenSubstatus.setId(1);
        defaultOpenSubstatus.setName("Open");
        defaultOpenSubstatus.setStatus("open");
        defaultOpenSubstatus.setIsDefault(true);

        closedSubstatus = new Substatus();
        closedSubstatus.setId(2);
        closedSubstatus.setName("Resolved");
        closedSubstatus.setStatus("closed");
        closedSubstatus.setIsDefault(true);
    }

    @Test
    void testCreateTicket_success_createsTicketAndAppendsOpenHistory() {
        CreateTicketRequest request = new CreateTicketRequest(
                1, "Test description", null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null
        );

        when(categoryRepository.findById(1)).thenReturn(Optional.of(activeCategory));
        when(permissionEvaluator.isAllowed("staff", "anonymous")).thenReturn(true);
        when(substatusRepository.findFirstByStatusAndIsDefaultTrue("open")).thenReturn(Optional.of(defaultOpenSubstatus));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> {
            Ticket t = inv.getArgument(0);
            t.setId(100L);
            return t;
        });
        when(ticketHistoryService.append(anyLong(), anyInt(), any(), any(), any(), any())).thenReturn(null);

        Ticket result = ticketService.createTicket(request, 1, "staff");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("open");
        assertThat(result.getSubstatusId()).isEqualTo(1);
        verify(ticketHistoryService).append(eq(100L), eq(1), eq(1), isNull(), isNull(), isNull());
    }

    @Test
    void testCreateTicket_inactiveCategory_throws404() {
        Category inactiveCategory = new Category();
        inactiveCategory.setId(5);
        inactiveCategory.setActive(false);

        // findById returns empty when filtered by active=true in service
        when(categoryRepository.findById(5)).thenReturn(Optional.of(inactiveCategory));

        CreateTicketRequest request = new CreateTicketRequest(
                5, "Test", null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> ticketService.createTicket(request, 1, "staff"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    void testCreateTicket_permissionDenied_throws403() {
        activeCategory.setPostingPermissionLevel("staff");

        when(categoryRepository.findById(1)).thenReturn(Optional.of(activeCategory));
        when(permissionEvaluator.isAllowed("public", "staff")).thenReturn(false);

        CreateTicketRequest request = new CreateTicketRequest(
                1, "Test", null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> ticketService.createTicket(request, 2, "public"))
                .isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    void testCreateTicket_emptyDescription_throws422() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(activeCategory));
        when(permissionEvaluator.isAllowed("staff", "anonymous")).thenReturn(true);

        CreateTicketRequest request = new CreateTicketRequest(
                1, "   ", null, null, null,
                null, null, null, null, null, null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> ticketService.createTicket(request, 1, "staff"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Description");
    }

    @Test
    void testCreateTicket_invalidCoordinates_throws422() {
        when(categoryRepository.findById(1)).thenReturn(Optional.of(activeCategory));
        when(permissionEvaluator.isAllowed("staff", "anonymous")).thenReturn(true);

        CreateTicketRequest request = new CreateTicketRequest(
                1, "Test", null, null, null,
                null, null, null, null, null, null, null, null,
                BigDecimal.valueOf(200), BigDecimal.valueOf(-100), // lat 200 is invalid
                null, null, null
        );

        assertThatThrownBy(() -> ticketService.createTicket(request, 1, "staff"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Latitude");
    }

    @Test
    void testCloseTicket_success_setsStatusClosedAndAppendsHistory() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus("open");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(substatusRepository.findById(2)).thenReturn(Optional.of(closedSubstatus));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ticketHistoryService.append(anyLong(), anyInt(), any(), any(), any(), any())).thenReturn(null);

        CloseTicketRequest req = new CloseTicketRequest(2, "Resolved successfully");
        Ticket result = ticketService.closeTicket(1L, req, 10);

        assertThat(result.getStatus()).isEqualTo("closed");
        assertThat(result.getClosedDate()).isNotNull();
        assertThat(result.getSubstatusId()).isEqualTo(2);
        verify(ticketHistoryService).append(eq(1L), eq(3), eq(10), isNull(), eq("Resolved successfully"), isNull());
    }

    @Test
    void testCloseTicket_alreadyClosed_throws422() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus("closed");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.closeTicket(1L, new CloseTicketRequest(2, null), 10))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("already closed");
    }

    @Test
    void testCloseTicket_wrongSubstatusType_throws422() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus("open");

        // Substatus has status "open" — should fail for closing
        Substatus wrongSubstatus = new Substatus();
        wrongSubstatus.setId(1);
        wrongSubstatus.setStatus("open");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(substatusRepository.findById(1)).thenReturn(Optional.of(wrongSubstatus));

        assertThatThrownBy(() -> ticketService.closeTicket(1L, new CloseTicketRequest(1, null), 10))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("closed");
    }

    @Test
    void testMarkDuplicate_circularParentage_throws422() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setParentId(null);

        Ticket parent = new Ticket();
        parent.setId(2L);
        parent.setParentId(1L); // parent's parent is ticket — circular!

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.findById(2L)).thenReturn(Optional.of(parent));

        assertThatThrownBy(() -> ticketService.markDuplicate(1L, 2L, 10))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("Circular");
    }

    @Test
    void testReopenTicket_success_setsStatusOpen() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus("closed");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(substatusRepository.findFirstByStatusAndIsDefaultTrue("open")).thenReturn(Optional.of(defaultOpenSubstatus));
        when(ticketRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(ticketHistoryService.append(anyLong(), anyInt(), any(), any(), any(), any())).thenReturn(null);

        Ticket result = ticketService.reopenTicket(1L, "New information", 10);

        assertThat(result.getStatus()).isEqualTo("open");
        assertThat(result.getClosedDate()).isNull();
        assertThat(result.getSubstatusId()).isEqualTo(1);
        verify(ticketHistoryService).append(eq(1L), eq(8), eq(10), isNull(), eq("New information"), isNull());
    }

    @Test
    void testReopenTicket_alreadyOpen_throws422() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus("open");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.reopenTicket(1L, null, 10))
                .isInstanceOf(InvalidTransitionException.class)
                .hasMessageContaining("already open");
    }

    @Test
    void testAssignTicket_nonStaffAssignee_throws422() {
        Ticket ticket = new Ticket();
        ticket.setId(1L);
        ticket.setStatus("open");

        Person publicPerson = new Person();
        publicPerson.setId(5);
        publicPerson.setRole("public");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(ticket));
        when(personRepository.findById(5)).thenReturn(Optional.of(publicPerson));

        assertThatThrownBy(() -> ticketService.assignTicket(1L, 5, 10))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("staff");
    }
}
