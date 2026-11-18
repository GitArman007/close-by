package com.closeby.report;

import com.closeby.visit.ServiceType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class ReportDtos {

    private ReportDtos() {}

    public record CompleteVisitReportRequest(
            @Min(50) @Max(260) Integer bpSystolic,
            @Min(30) @Max(180) Integer bpDiastolic,
            @DecimalMin("90.0") @DecimalMax("110.0") BigDecimal temperatureF,
            @Min(20) @Max(600) Integer bloodSugarMgDl,
            BloodSugarContext bloodSugarContext,
            @NotBlank @Size(max = 2000) String observationNotes,
            @NotNull RecommendationType recommendation
    ) {}

    public record VisitReportDto(
            UUID id,
            UUID visitId,
            UUID clinicId,
            String clinicName,
            String clinicLocality,
            UUID parentId,
            String parentName,
            int parentAge,
            ServiceType serviceType,
            String serviceLabel,
            LocalDate scheduledDate,
            UUID recordedByStaffId,
            String staffName,
            String staffDesignation,
            String staffVerifiedBadge,
            Integer bpSystolic,
            Integer bpDiastolic,
            BigDecimal temperatureF,
            Integer bloodSugarMgDl,
            BloodSugarContext bloodSugarContext,
            String observationNotes,
            RecommendationType recommendation,
            Instant recordedAt,
            String observationsDisclaimer,
            String emergencyNotice
    ) {}
}
