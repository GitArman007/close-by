package com.closeby.auth;

import com.closeby.clinic.ClinicStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterFamilyRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(max = 20) String phone,
            @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record RegisterClinicRequest(
            @NotBlank @Size(max = 120) String adminFullName,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(max = 20) String adminPhone,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 150) String clinicName,
            @NotBlank @Size(max = 80) String registrationNumber,
            @NotBlank @Size(max = 100) String locality,
            @NotBlank String address,
            @NotBlank @Size(max = 20) String clinicPhone
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record UserSummaryDto(
            UUID id,
            String fullName,
            String email,
            String phone,
            UserRole role,
            UUID clinicId,
            String clinicName,
            ClinicStatus clinicStatus
    ) {}

    public record AuthResponse(
            String accessToken,
            String tokenType,
            long expiresInSeconds,
            UserSummaryDto user
    ) {}
}
