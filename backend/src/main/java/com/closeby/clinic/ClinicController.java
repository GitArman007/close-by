package com.closeby.clinic;

import com.closeby.auth.AuthPrincipal;
import com.closeby.clinic.ClinicDtos.ClinicDto;
import com.closeby.clinic.ClinicDtos.UpdateClinicProfileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Clinics", description = "Approved Bhopal clinic directory and clinic profile management")
public class ClinicController {

    private final ClinicService clinicService;

    public ClinicController(ClinicService clinicService) {
        this.clinicService = clinicService;
    }

    @GetMapping("/clinics")
    @PreAuthorize("hasAnyRole('FAMILY', 'PLATFORM_ADMIN')")
    @Operation(summary = "List approved Bhopal clinics available for home visit booking")
    public List<ClinicDto> listApprovedClinics(@AuthenticationPrincipal AuthPrincipal principal) {
        return clinicService.listApprovedClinics(principal);
    }

    @GetMapping("/clinic/profile")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'CLINIC_STAFF')")
    @Operation(summary = "Get the authenticated clinic user's own clinic profile")
    public ClinicDto getOwnProfile(@AuthenticationPrincipal AuthPrincipal principal) {
        return clinicService.getOwnClinicProfile(principal);
    }

    @PutMapping("/clinic/profile")
    @PreAuthorize("hasRole('CLINIC_ADMIN')")
    @Operation(summary = "Update the authenticated Clinic Admin's own clinic profile")
    public ClinicDto updateOwnProfile(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody UpdateClinicProfileRequest request
    ) {
        return clinicService.updateOwnClinicProfile(principal, request);
    }
}
