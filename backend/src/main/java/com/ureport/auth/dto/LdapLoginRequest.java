package com.ureport.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LdapLoginRequest(
    @NotBlank @Size(max = 40) String username,  // max 40 chars per TechArch
    @NotBlank String password                   // never logged or stored
) {}
