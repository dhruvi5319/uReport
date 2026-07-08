package com.ureport.auth;

import com.ureport.domain.Person;
import com.ureport.repository.PersonRepository;
import com.ureport.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import javax.naming.directory.DirContext;

@Service
public class LdapAuthService {

    private final JwtService jwtService;
    private final PersonRepository personRepository;

    @Value("${ldap.enabled:false}")
    private boolean ldapEnabled;

    @Value("${ldap.url:ldap://localhost:389}")
    private String ldapUrl;

    @Value("${ldap.base-dn:dc=city,dc=gov}")
    private String baseDn;

    @Value("${ldap.user-dn-pattern:uid={0},ou=people}")
    private String userDnPattern;

    public LdapAuthService(JwtService jwtService, PersonRepository personRepository) {
        this.jwtService = jwtService;
        this.personRepository = personRepository;
    }

    /**
     * Authenticate via LDAP bind.
     * Returns a signed JWT string on success, throws on failure.
     * If ldap.enabled=false, throws IllegalStateException (returns "not enabled" error).
     */
    public String authenticate(String username, String password) {
        if (!ldapEnabled) {
            throw new IllegalStateException("LDAP authentication is not enabled");
        }

        // Build user DN from pattern (e.g., "uid={0},ou=people,dc=city,dc=gov")
        String userDn = userDnPattern.replace("{0}", username) + "," + baseDn;

        // Attempt LDAP bind — throws on failure
        LdapContextSource contextSource = new LdapContextSource();
        contextSource.setUrl(ldapUrl);
        contextSource.setBase(baseDn);
        contextSource.setUserDn(userDn);
        contextSource.setPassword(password);
        try {
            contextSource.afterPropertiesSet();
        } catch (Exception e) {
            throw new BadCredentialsException("LDAP context source configuration failed", e);
        }

        try {
            DirContext ctx = contextSource.getContext(userDn, password);
            ctx.close();
        } catch (Exception e) {
            throw new BadCredentialsException(
                "LDAP authentication failed for user: " + username, e);
        }

        // Look up or create Person record by username
        Person person = personRepository.findByUsername(username)
                .orElseGet(() -> {
                    Person newPerson = new Person(username, "staff"); // default role for new LDAP users
                    return personRepository.save(newPerson);
                });

        return jwtService.generateToken(person.getId(), person.getUsername(), person.getRole());
    }
}
