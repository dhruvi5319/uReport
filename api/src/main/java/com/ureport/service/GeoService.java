package com.ureport.service;

import com.ureport.entity.Location;
import com.ureport.entity.Ticket;
import com.ureport.repository.LocationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Transactional
public class GeoService {

    private final LocationRepository locationRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public GeoService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    /**
     * Find or create a canonical location for the given address components.
     * Deduplicates by address+city+state+zip.
     */
    public Location normalizeAddress(String address, String city, String state, String zip) {
        Optional<Location> existing = locationRepository.findByAddressAndCityAndStateAndZip(
                address, city, state, zip);
        if (existing.isPresent()) {
            return existing.get();
        }

        Location loc = new Location();
        loc.setAddress(address);
        loc.setCity(city);
        loc.setState(state);
        loc.setZip(zip);
        return locationRepository.save(loc);
    }

    /**
     * Sync geo_point for a location if lat/long are set.
     * Uses a native SQL query to set the PostGIS GEOGRAPHY column.
     */
    public void syncGeoPoint(Location loc) {
        if (loc.getLatitude() == null || loc.getLongitude() == null) {
            return;
        }
        entityManager.createNativeQuery(
                "UPDATE locations SET geo_point = ST_MakePoint(:lon, :lat)::geography WHERE id = :id")
                .setParameter("lon", loc.getLongitude())
                .setParameter("lat", loc.getLatitude())
                .setParameter("id", loc.getId())
                .executeUpdate();
    }

    /**
     * Assign a ticket to a canonical location if it has lat/long but no addressId.
     */
    public void assignTicketToLocation(Ticket ticket) {
        if (ticket.getLatitude() == null || ticket.getLongitude() == null) {
            return;
        }
        if (ticket.getAddressId() != null) {
            return;
        }

        String address = ticket.getLocation() != null ? ticket.getLocation() : "Unknown";
        String city = ticket.getCity() != null ? ticket.getCity() : "";
        String state = ticket.getState() != null ? ticket.getState() : "";
        String zip = ticket.getZip() != null ? ticket.getZip() : "";

        Location loc = normalizeAddress(address, city, state, zip);
        if (loc.getLatitude() == null) {
            loc.setLatitude(ticket.getLatitude());
            loc.setLongitude(ticket.getLongitude());
            locationRepository.save(loc);
            syncGeoPoint(loc);
        }

        ticket.setAddressId(loc.getId());
    }
}
