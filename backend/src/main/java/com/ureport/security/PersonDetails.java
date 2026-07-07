package com.ureport.security;

import com.ureport.domain.Person;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Spring Security UserDetails implementation wrapping Person entity.
 * Used as the principal in the SecurityContext after JWT authentication.
 */
public class PersonDetails implements UserDetails {

    private final Long id;
    private final String username;
    private final String passwordHash;
    private final String role;

    public PersonDetails(Person person) {
        this.id = person.getId();
        this.username = person.getUsername() != null ? person.getUsername() : person.getEmail();
        this.passwordHash = person.getPasswordHash();
        this.role = person.getRole() != null ? person.getRole() : "public";
    }

    // Constructor for test use
    public PersonDetails(Long id, String username, String role) {
        this.id = id;
        this.username = username;
        this.passwordHash = "";
        this.role = role;
    }

    public Long getId() { return id; }
    public String getRole() { return role; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
