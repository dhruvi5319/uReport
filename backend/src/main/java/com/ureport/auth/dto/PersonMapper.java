package com.ureport.auth.dto;

import com.ureport.domain.Person;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PersonMapper {
    @Mapping(source = "id", target = "personId")
    @Mapping(target = "expiresAt", ignore = true)
    AuthMeResponse toAuthMeResponse(Person person);
}
