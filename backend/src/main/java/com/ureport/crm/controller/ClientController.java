package com.ureport.crm.controller;

import com.ureport.crm.dto.ClientDetailDto;
import com.ureport.crm.dto.CreateClientRequest;
import com.ureport.crm.dto.UpdateClientRequest;
import com.ureport.crm.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only REST controller for Open311 client CRUD.
 *
 * All endpoints require ADMIN role (T-04-24: /api/clients endpoints accessible to STAFF → 403).
 *
 * Endpoints per TechArch API spec §4.3:
 * GET    /api/clients        → 200 List<ClientDetailDto>    (apiKey masked)
 * POST   /api/clients        → 201 ClientDetailDto          (apiKey returned once)
 * GET    /api/clients/{id}   → 200 ClientDetailDto          (apiKey masked)
 * PUT    /api/clients/{id}   → 200 ClientDetailDto          (apiKey masked)
 * DELETE /api/clients/{id}   → 204
 */
@RestController
@RequestMapping("/api/clients")
@PreAuthorize("hasRole('ADMIN')")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    /**
     * GET /api/clients — list all Open311 clients.
     * api_key is masked in the response.
     */
    @GetMapping
    public ResponseEntity<List<ClientDetailDto>> listClients() {
        return ResponseEntity.ok(clientService.list());
    }

    /**
     * POST /api/clients — create a new client with generated UUID api_key.
     * Returns HTTP 201 with ClientDetailDto including the actual api_key (only time exposed).
     */
    @PostMapping
    public ResponseEntity<ClientDetailDto> createClient(@Valid @RequestBody CreateClientRequest req) {
        ClientDetailDto dto = clientService.create(req);
        return ResponseEntity.status(201).body(dto);
    }

    /**
     * GET /api/clients/{id} — retrieve a single client.
     * api_key is masked (null) in the response.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClientDetailDto> getClient(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.get(id));
    }

    /**
     * PUT /api/clients/{id} — update mutable client fields.
     * api_key is preserved (never regenerated) and masked in the response.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ClientDetailDto> updateClient(
            @PathVariable Long id,
            @RequestBody UpdateClientRequest req) {
        return ResponseEntity.ok(clientService.update(id, req));
    }

    /**
     * DELETE /api/clients/{id} — delete a client.
     * Returns HTTP 204 on success.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
