package com.ureport.service;

import com.ureport.entity.Client;
import com.ureport.exception.NotFoundException;
import com.ureport.exception.PermissionDeniedException;
import com.ureport.repository.ClientRepository;
import com.ureport.util.ApiKeyHashUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    private ApiKeyHashUtil apiKeyHashUtil;
    private ClientService clientService;

    @BeforeEach
    void setUp() {
        apiKeyHashUtil = new ApiKeyHashUtil();
        clientService = new ClientService(clientRepository, apiKeyHashUtil);
    }

    @Test
    void testCreateClient_rawApiKeyInResponse() {
        // Arrange
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> {
            Client c = inv.getArgument(0);
            c.setId(1);
            return c;
        });

        // Act
        Map<String, Object> result = clientService.createClient("Test Client", null, null, null);

        // Assert
        assertNotNull(result.get("rawApiKey"));
        String rawApiKey = (String) result.get("rawApiKey");
        assertFalse(rawApiKey.isEmpty());

        // Verify client was saved with hashed keys (not raw)
        verify(clientRepository).save(argThat(client -> {
            // api_key_hash should be BCrypt (starts with $2a$ or $2b$)
            String hash = client.getApiKeyHash();
            return hash != null && (hash.startsWith("$2a$") || hash.startsWith("$2b$"));
        }));
    }

    @Test
    void testRotateKey_changesLookupAndHash() {
        // Arrange
        String oldRawKey = "old-raw-key-" + System.currentTimeMillis();
        String oldLookup = apiKeyHashUtil.hashForLookup(oldRawKey);
        String oldHash = apiKeyHashUtil.hashForStorage(oldRawKey);

        Client client = new Client();
        client.setId(1);
        client.setName("Test Client");
        client.setApiKeyLookup(oldLookup);
        client.setApiKeyHash(oldHash);

        when(clientRepository.findById(1)).thenReturn(Optional.of(client));
        when(clientRepository.save(any(Client.class))).thenReturn(client);

        // Act
        Map<String, Object> result = clientService.rotateKey(1);

        // Assert
        String newRawKey = (String) result.get("rawApiKey");
        assertNotNull(newRawKey);
        assertNotEquals(oldRawKey, newRawKey);

        // Verify the new lookup != old lookup
        verify(clientRepository).save(argThat(c -> {
            String newLookup = c.getApiKeyLookup();
            return newLookup != null && !newLookup.equals(oldLookup);
        }));
    }

    @Test
    void testValidateApiKey_invalidKey_throws403() {
        // Arrange
        String fakeKey = "completely-invalid-key";
        String fakeLookup = apiKeyHashUtil.hashForLookup(fakeKey);

        when(clientRepository.findByApiKeyLookup(fakeLookup)).thenReturn(Optional.empty());

        // Act & Assert
        PermissionDeniedException ex = assertThrows(PermissionDeniedException.class,
                () -> clientService.validateApiKey(fakeKey));

        assertEquals("INVALID_API_KEY", ex.getErrorCode());
    }

    @Test
    void testValidateApiKey_validKey_returnsClient() {
        // Arrange
        String rawKey = apiKeyHashUtil.generateKey();
        String lookup = apiKeyHashUtil.hashForLookup(rawKey);
        String hash = apiKeyHashUtil.hashForStorage(rawKey);

        Client client = new Client();
        client.setId(1);
        client.setName("Valid Client");
        client.setApiKeyLookup(lookup);
        client.setApiKeyHash(hash);

        when(clientRepository.findByApiKeyLookup(lookup)).thenReturn(Optional.of(client));

        // Act
        Client result = clientService.validateApiKey(rawKey);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getId());
        assertEquals("Valid Client", result.getName());
    }

    @Test
    void testCreateClient_storedHashNotRawKey() {
        // Arrange
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> {
            Client c = inv.getArgument(0);
            c.setId(1);
            return c;
        });

        // Act
        Map<String, Object> result = clientService.createClient("Test", null, null, null);
        String rawApiKey = (String) result.get("rawApiKey");

        // Assert: raw key should NOT equal the stored hash
        verify(clientRepository).save(argThat(client ->
                !rawApiKey.equals(client.getApiKeyHash()) &&
                !rawApiKey.equals(client.getApiKeyLookup())
        ));
    }

    @Test
    void testDeleteClient_notFound_throwsNotFoundException() {
        // Arrange
        when(clientRepository.existsById(999)).thenReturn(false);

        // Act & Assert
        assertThrows(NotFoundException.class, () -> clientService.deleteClient(999));
    }
}
