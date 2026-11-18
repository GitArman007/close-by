package com.closeby.parent;

import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.UUID;

public final class ParentDtos {

    private ParentDtos() {}

    public record CreateParentRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotNull @Min(1) @Max(129) Integer age,
            @NotBlank @Size(max = 20) String gender,
            @Size(max = 20) String phone,
            @NotBlank @Size(max = 100) String locality,
            @NotBlank String address,
            @Size(max = 1000) String notes,
            @NotNull Boolean consentConfirmed
    ) {}

    public record UpdateParentRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotNull @Min(1) @Max(129) Integer age,
            @NotBlank @Size(max = 20) String gender,
            @Size(max = 20) String phone,
            @NotBlank @Size(max = 100) String locality,
            @NotBlank String address,
            @Size(max = 1000) String notes
    ) {}

    public record ParentDto(
            UUID id,
            UUID familyUserId,
            String fullName,
            int age,
            String gender,
            String phone,
            String locality,
            String address,
            String notes,
            boolean consentConfirmed,
            Instant consentConfirmedAt,
            Instant createdAt
    ) {
        public static ParentDto from(Parent parent) {
            return new ParentDto(
                    parent.getId(),
                    parent.getFamilyUserId(),
                    parent.getFullName(),
                    parent.getAge(),
                    parent.getGender(),
                    parent.getPhone(),
                    parent.getLocality(),
                    parent.getAddress(),
                    parent.getNotes(),
                    parent.isConsentConfirmed(),
                    parent.getConsentConfirmedAt(),
                    parent.getCreatedAt()
            );
        }
    }
}
