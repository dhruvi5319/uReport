package com.ureport.service;

import com.ureport.entity.Location;
import com.ureport.repository.LocationRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeoServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private EntityManager entityManager;

    private GeoService geoService;

    @BeforeEach
    void setUp() {
        geoService = new GeoService(locationRepository);
        // Inject EntityManager via reflection for testing
        try {
            var field = GeoService.class.getDeclaredField("entityManager");
            field.setAccessible(true);
            field.set(geoService, entityManager);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testNormalizeAddress_createsNewLocation() {
        // Arrange
        String address = "123 Main St";
        String city = "Springfield";
        String state = "IL";
        String zip = "62701";

        when(locationRepository.findByAddressAndCityAndStateAndZip(address, city, state, zip))
                .thenReturn(Optional.empty());
        when(locationRepository.save(any(Location.class))).thenAnswer(inv -> {
            Location loc = inv.getArgument(0);
            loc.setId(1);
            return loc;
        });

        // Act
        Location result = geoService.normalizeAddress(address, city, state, zip);

        // Assert
        assertNotNull(result);
        assertEquals(address, result.getAddress());
        assertEquals(city, result.getCity());
        assertEquals(state, result.getState());
        assertEquals(zip, result.getZip());
        verify(locationRepository).save(any(Location.class));
    }

    @Test
    void testNormalizeAddress_returnsExistingLocation() {
        // Arrange
        String address = "456 Oak Ave";
        String city = "Chicago";
        String state = "IL";
        String zip = "60601";

        Location existing = new Location();
        existing.setId(99);
        existing.setAddress(address);
        existing.setCity(city);
        existing.setState(state);
        existing.setZip(zip);

        when(locationRepository.findByAddressAndCityAndStateAndZip(address, city, state, zip))
                .thenReturn(Optional.of(existing));

        // Act
        Location result = geoService.normalizeAddress(address, city, state, zip);

        // Assert
        assertNotNull(result);
        assertEquals(99, result.getId());
        assertEquals(address, result.getAddress());
        // Verify no new row was created
        verify(locationRepository, never()).save(any());
    }

    @Test
    void testNormalizeAddress_deduplicatesByAllFields() {
        // Arrange — same address but different city should be treated as different location
        String address = "100 Same St";
        String city1 = "City A";
        String city2 = "City B";
        String state = "TX";
        String zip = "75001";

        Location locationA = new Location();
        locationA.setId(1);
        locationA.setAddress(address);
        locationA.setCity(city1);

        when(locationRepository.findByAddressAndCityAndStateAndZip(address, city1, state, zip))
                .thenReturn(Optional.of(locationA));
        when(locationRepository.findByAddressAndCityAndStateAndZip(address, city2, state, zip))
                .thenReturn(Optional.empty());
        when(locationRepository.save(any(Location.class))).thenAnswer(inv -> {
            Location loc = inv.getArgument(0);
            loc.setId(2);
            return loc;
        });

        // Act
        Location result1 = geoService.normalizeAddress(address, city1, state, zip);
        Location result2 = geoService.normalizeAddress(address, city2, state, zip);

        // Assert — different locations for different cities
        assertEquals(1, result1.getId());
        assertEquals(2, result2.getId());
        verify(locationRepository, times(1)).save(any());
    }
}
