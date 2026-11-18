package com.closeby.common;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI closeByOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("closeBy REST API")
                        .version("1.0.0")
                        .description("""
                                Remote parent-care coordination platform (LNCTS Bhopal Final-Year Major Project).
                                Records factual home-visit observations only — never diagnoses or prescribes.
                                In an emergency, call 108 or 112.
                                """)
                        .contact(new Contact().name("closeBy · LNCTS Bhopal")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
