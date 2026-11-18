package com.closeby.staff;

import com.closeby.auth.AuthPrincipal;
import com.closeby.staff.StaffDtos.CreateStaffRequest;
import com.closeby.staff.StaffDtos.StaffDto;
import com.closeby.staff.StaffDtos.UpdateStaffStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clinic/staff")
@PreAuthorize("hasRole('CLINIC_ADMIN')")
@Tag(name = "Clinic Staff", description = "Verified clinic staff management (scoped strictly to caller's clinic)")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    @Operation(summary = "List staff belonging to the authenticated Clinic Admin's clinic")
    public List<StaffDto> listStaff(@AuthenticationPrincipal AuthPrincipal principal) {
        return staffService.listOwnClinicStaff(principal);
    }

    @GetMapping("/{staffUserId}")
    @Operation(summary = "Get a staff member belonging to the authenticated Clinic Admin's clinic")
    public StaffDto getStaff(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID staffUserId
    ) {
        return staffService.getOwnClinicStaff(principal, staffUserId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a verified staff member marked 'Verified by <Clinic>' (approved clinics only)")
    public StaffDto createStaff(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreateStaffRequest request
    ) {
        return staffService.createStaff(principal, request);
    }

    @PatchMapping("/{staffUserId}/status")
    @Operation(summary = "Activate or deactivate a staff member belonging to the caller's clinic")
    public StaffDto updateStaffStatus(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID staffUserId,
            @Valid @RequestBody UpdateStaffStatusRequest request
    ) {
        return staffService.updateStaffStatus(principal, staffUserId, request.active());
    }
}
