package com.closeby.visit;

import com.closeby.auth.AuthPrincipal;
import com.closeby.visit.VisitDtos.AssignStaffRequest;
import com.closeby.visit.VisitDtos.CancelVisitRequest;
import com.closeby.visit.VisitDtos.CreateVisitRequest;
import com.closeby.visit.VisitDtos.VisitDto;
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
@RequestMapping("/api/v1/visits")
@Tag(name = "Visits", description = "Home visit booking, staff assignment, and lifecycle state machine")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FAMILY')")
    @Operation(summary = "Request a new home visit for an owned parent at an approved Bhopal clinic")
    public VisitDto createVisit(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreateVisitRequest request
    ) {
        return visitService.createVisit(principal, request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('FAMILY', 'CLINIC_ADMIN', 'CLINIC_STAFF')")
    @Operation(summary = "List visits strictly scoped to the caller's family, clinic, or assigned staff queue")
    public List<VisitDto> listVisits(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestParam(required = false) VisitStatus status
    ) {
        return visitService.listVisits(principal, status);
    }

    @GetMapping("/{visitId}")
    @PreAuthorize("hasAnyRole('FAMILY', 'CLINIC_ADMIN', 'CLINIC_STAFF')")
    @Operation(summary = "Get visit details with strict ownership and clinic isolation")
    public VisitDto getVisit(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID visitId
    ) {
        return visitService.getVisit(principal, visitId);
    }

    @PatchMapping("/{visitId}/assign")
    @PreAuthorize("hasRole('CLINIC_ADMIN')")
    @Operation(summary = "Assign a verified staff member from caller's clinic (REQUESTED -> ASSIGNED)")
    public VisitDto assignStaff(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID visitId,
            @Valid @RequestBody AssignStaffRequest request
    ) {
        return visitService.assignStaff(principal, visitId, request.staffUserId());
    }

    @PatchMapping("/{visitId}/start")
    @PreAuthorize("hasRole('CLINIC_STAFF')")
    @Operation(summary = "Assigned staff marks visit in progress (ASSIGNED -> IN_PROGRESS)")
    public VisitDto startVisit(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID visitId
    ) {
        return visitService.startVisit(principal, visitId);
    }

    @PatchMapping("/{visitId}/cancel")
    @PreAuthorize("hasAnyRole('FAMILY', 'CLINIC_ADMIN')")
    @Operation(summary = "Cancel a visit in REQUESTED or ASSIGNED status")
    public VisitDto cancelVisit(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID visitId,
            @Valid @RequestBody(required = false) CancelVisitRequest request
    ) {
        return visitService.cancelVisit(principal, visitId, request != null ? request.reason() : null);
    }
}
