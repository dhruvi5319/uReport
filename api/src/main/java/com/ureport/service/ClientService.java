package com.ureport.service;

import com.ureport.entity.Client;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.repository.ClientRepository;
import com.ureport.util.ApiKeyHashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;
    private final ApiKeyHashUtil apiKeyHashUtil;

    @Autowired
    public ClientService(ClientRepository clientRepository, ApiKeyHashUtil apiKeyHashUtil) {
        this.clientRepository = clientRepository;
        this.apiKeyHashUtil = apiKeyHashUtil;
    }

    /**
     * Create a new API client. Returns rawApiKey in response (only time it is returned).
     * Response includes: client + rawApiKey field.
     */
    public Map<String, Object> createClient(String name, String url,
                                             Integer contactPersonId, Integer contactMethodId) {
        String rawApiKey = apiKeyHashUtil.generateKey();
        String lookup = apiKeyHashUtil.hashForLookup(rawApiKey);
        String hash = apiKeyHashUtil.hashForStorage(rawApiKey);

        Client client = new Client();
        client.setName(name);
        client.setUrl(url);
        client.setApiKeyLookup(lookup);
        client.setApiKeyHash(hash);
        client.setContactPersonId(contactPersonId);
        client.setContactMethodId(contactMethodId);
        client = clientRepository.save(client);

        return Map.of(
                "id", client.getId(),
                "name", client.getName(),
                "url", client.getUrl() != null ? client.getUrl() : "",
                "rawApiKey", rawApiKey
        );
    }

    /**
     * Get client details (no rawApiKey exposed).
     */
    @Transactional(readOnly = true)
    public Client getClient(Integer id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("CLIENT_NOT_FOUND", "Client not found: " + id));
    }

    /**
     * List all clients (no rawApiKey exposed).
     */
    @Transactional(readOnly = true)
    public List<Client> listClients() {
        return clientRepository.findAll();
    }

    /**
     * Update client details (name, url, contactPerson_id, contactMethod_id).
     * Does NOT change api_key unless rotateKey is requested.
     */
    public Client updateClient(Integer id, String name, String url,
                                Integer contactPersonId, Integer contactMethodId) {
        Client client = getClient(id);
        if (name != null) client.setName(name);
        if (url != null) client.setUrl(url);
        if (contactPersonId != null) client.setContactPersonId(contactPersonId);
        if (contactMethodId != null) client.setContactMethodId(contactMethodId);
        return clientRepository.save(client);
    }

    /**
     * Rotate the API key for a client. Returns new rawApiKey (takes effect immediately).
     */
    public Map<String, Object> rotateKey(Integer id) {
        Client client = getClient(id);

        String rawApiKey = apiKeyHashUtil.generateKey();
        String lookup = apiKeyHashUtil.hashForLookup(rawApiKey);
        String hash = apiKeyHashUtil.hashForStorage(rawApiKey);

        client.setApiKeyLookup(lookup);
        client.setApiKeyHash(hash);
        clientRepository.save(client);

        return Map.of(
                "id", client.getId(),
                "name", client.getName(),
                "rawApiKey", rawApiKey
        );
    }

    /**
     * Delete a client.
     */
    public void deleteClient(Integer id) {
        if (!clientRepository.existsById(id)) {
            throw new NotFoundException("CLIENT_NOT_FOUND", "Client not found: " + id);
        }
        clientRepository.deleteById(id);
    }

    /**
     * Validate an API key using SHA-256 lookup + BCrypt verify.
     * Returns the Client entity if valid; throws 403 if not found or invalid.
     */
    @Transactional(readOnly = true)
    public Client validateApiKey(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            throw new PermissionDeniedException("INVALID_API_KEY", "Invalid API key");
        }

        String lookup = apiKeyHashUtil.hashForLookup(rawKey);
        Client client = clientRepository.findByApiKeyLookup(lookup)
                .orElseThrow(() -> new PermissionDeniedException("INVALID_API_KEY", "Invalid API key"));

        if (!apiKeyHashUtil.verify(rawKey, client.getApiKeyLookup(), client.getApiKeyHash())) {
            throw new PermissionDeniedException("INVALID_API_KEY", "Invalid API key");
        }

        return client;
    }
}
