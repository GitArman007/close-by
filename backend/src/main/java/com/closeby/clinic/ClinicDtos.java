package com.closeby.clinic;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class ClinicDtos {

    private ClinicDtos() {}

    public record ClinicDto(
            UUID id,
            String name,
            String registrationNumber,
            String locality,
            String address,
            String city,
            String phone,
            ClinicStatus status,
            String statusReason,
            UUID reviewedBy,
            Instant reviewedAt,
            Instant createdAt
    ) {
        public static ClinicDto from(Clinic clinic) {
            return new ClinicDto(
                    clinic.getId(),
                    clinic.getName(),
                    clinic.getRegistrationNumber(),
                    clinic.getLocality(),
                    clinic.getAddress(),
                    clinic.getCity(),
                    clinic.getPhone(),
                    clinic.getStatus(),
                    clinic.getStatusReason(),
                    clinic.getReviewedBy(),
                    clinic.getReviewedAt(),
                    clinic.getCreatedAt()
            );
        }
    }

    public record UpdateClinicProfileRequest(
            @NotBlank @Size(max = 150) String name,
            @NotBlank @Size(max = 100) String locality,
            @NotBlank String address,
            @NotBlank @Size(max = 20) String phone
    ) {}

    public record ClinicStatusActionRequest(
            @Size(max = 500) String reason
    ) {}
}
