package com.closeby.visit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class VisitDtos {

    private VisitDtos() {}

    public record CreateVisitRequest(
            @NotNull UUID parentId,
            @NotNull UUID clinicId,
            @NotNull ServiceType serviceType,
            @NotNull LocalDate scheduledDate,
            @NotBlank @Size(max = 40) String preferredTime,
            String visitAddress,
            @Size(max = 1000) String instructions
    ) {}

    public record AssignStaffRequest(
            @NotNull UUID staffUserId
    ) {}

    public record CancelVisitRequest(
            @Size(max = 500) String reason
    ) {}

    public record VisitDto(
            UUID id,
            UUID familyUserId,
            UUID parentId,
            String parentName,
            int parentAge,
            String parentLocality,
            UUID clinicId,
            String clinicName,
            String clinicLocality,
            UUID assignedStaffId,
            String assignedStaffName,
            String assignedStaffDesignation,
            String staffVerifiedBadge,
            ServiceType serviceType,
            String serviceLabel,
            LocalDate scheduledDate,
            String preferredTime,
            String visitAddress,
            String instructions,
            VisitStatus status,
            String cancellationReason,
            Instant assignedAt,
            Instant startedAt,
            Instant completedAt,
            Instant createdAt
    ) {}
}
