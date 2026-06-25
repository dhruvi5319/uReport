package com.ureport.controller;

import com.ureport.entity.Client;
import com.ureport.service.ClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clients")
@PreAuthorize("hasRole('STAFF')")
public class ClientController {

    private final ClientService clientService;

    @Autowired
    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    /**
     * GET /api/v1/clients — list clients
     */
    @GetMapping
    public ResponseEntity<List<Client>> listClients() {
        return ResponseEntity.ok(clientService.listClients());
    }

    /**
     * POST /api/v1/clients — create client (returns rawApiKey once)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createClient(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String url = (String) body.get("url");
        Integer contactPersonId = body.get("contactPerson_id") != null
                ? ((Number) body.get("contactPerson_id")).intValue() : null;
        Integer contactMethodId = body.get("contactMethod_id") != null
                ? ((Number) body.get("contactMethod_id")).intValue() : null;

        Map<String, Object> result = clientService.createClient(name, url, contactPersonId, contactMethodId);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/clients/{id} — client detail (no rawApiKey)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Client> getClient(@PathVariable Integer id) {
        return ResponseEntity.ok(clientService.getClient(id));
    }

    /**
     * PATCH /api/v1/clients/{id} — update or rotate key
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Object> updateClient(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {

        Boolean rotateKey = body.get("rotateKey") instanceof Boolean ? (Boolean) body.get("rotateKey") : false;

        if (Boolean.TRUE.equals(rotateKey)) {
            // Key rotation requested
            Map<String, Object> result = clientService.rotateKey(id);
            return ResponseEntity.ok(result);
        } else {
            // Regular update
            String name = (String) body.get("name");
            String url = (String) body.get("url");
            Integer contactPersonId = body.get("contactPerson_id") != null
                    ? ((Number) body.get("contactPerson_id")).intValue() : null;
            Integer contactMethodId = body.get("contactMethod_id") != null
                    ? ((Number) body.get("contactMethod_id")).intValue() : null;

            Client updated = clientService.updateClient(id, name, url, contactPersonId, contactMethodId);
            return ResponseEntity.ok(updated);
        }
    }

    /**
     * DELETE /api/v1/clients/{id} — delete client
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteClient(@PathVariable Integer id) {
        clientService.deleteClient(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
