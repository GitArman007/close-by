package com.closeby.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class StaffDtos {

    private StaffDtos() {}

    public record CreateStaffRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(max = 20) String phone,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 80) String designation
    ) {}

    public record UpdateStaffStatusRequest(
            @NotNull Boolean active
    ) {}

    public record StaffDto(
            UUID userId,
            UUID profileId,
            UUID clinicId,
            String clinicName,
            String fullName,
            String email,
            String phone,
            String designation,
            boolean verifiedByClinic,
            String verifiedBadge,
            Instant verifiedAt,
            boolean active
    ) {}
}
