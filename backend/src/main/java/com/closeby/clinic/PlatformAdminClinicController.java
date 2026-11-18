package com.closeby.clinic;

import com.closeby.auth.AuthPrincipal;
import com.closeby.clinic.ClinicDtos.ClinicDto;
import com.closeby.clinic.ClinicDtos.ClinicStatusActionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/clinics")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
@Tag(name = "Platform Admin — Clinics", description = "Clinic governance: approve, reject, and suspend Bhopal clinics")
public class PlatformAdminClinicController {

    private final ClinicService clinicService;

    public PlatformAdminClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @GetMapping
    @Operation(summary = "List all registered clinics, optionally filtered by status")
    public List<ClinicDto> listClinics(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestParam(required = false) ClinicStatus status
    ) {
        return clinicService.listAllClinicsForAdmin(principal, status);
    }

    @PatchMapping("/{clinicId}/approve")
    @Operation(summary = "Approve a pending or suspended clinic")
    public ClinicDto approveClinic(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID clinicId
    ) {
        return clinicService.approveClinic(principal, clinicId);
    }

    @PatchMapping("/{clinicId}/reject")
    @Operation(summary = "Reject a pending clinic")
    public ClinicDto rejectClinic(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID clinicId,
            @Valid @RequestBody(required = false) ClinicStatusActionRequest request
    ) {
        return clinicService.rejectClinic(principal, clinicId, request != null ? request.reason() : null);
    }

    @PatchMapping("/{clinicId}/suspend")
    @Operation(summary = "Suspend an approved clinic")
    public ClinicDto suspendClinic(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID clinicId,
            @Valid @RequestBody(required = false) ClinicStatusActionRequest request
    ) {
        return clinicService.suspendClinic(principal, clinicId, request != null ? request.reason() : null);
    }
}
