package com.closeby.report;

import com.closeby.auth.AuthPrincipal;
import com.closeby.report.ReportDtos.CompleteVisitReportRequest;
import com.closeby.report.ReportDtos.VisitReportDto;
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
@RequestMapping("/api/v1")
@Tag(name = "Visit Reports", description = "Observations-only visit reports (non-diagnostic) with automatic access audit logging")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/visits/{visitId}/complete")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLINIC_STAFF')")
    @Operation(summary = "Submit an observation-only report and atomically complete an IN_PROGRESS visit")
    public VisitReportDto completeVisit(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID visitId,
            @Valid @RequestBody CompleteVisitReportRequest request
    ) {
        return reportService.completeVisitWithReport(principal, visitId, request);
    }

    @GetMapping("/visits/{visitId}/report")
    @PreAuthorize("hasAnyRole('FAMILY', 'CLINIC_ADMIN', 'CLINIC_STAFF')")
    @Operation(summary = "Read a visit report (writes an entry to report_access_logs on every authorized view)")
    public VisitReportDto getReport(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID visitId
    ) {
        return reportService.getReportForVisit(principal, visitId);
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('CLINIC_ADMIN')")
    @Operation(summary = "List completed observation reports strictly for the authenticated clinic")
    public List<VisitReportDto> listOwnClinicReports(@AuthenticationPrincipal AuthPrincipal principal) {
        return reportService.listOwnClinicReports(principal);
    }

    @GetMapping("/parents/{parentId}/reports")
    @PreAuthorize("hasRole('FAMILY')")
    @Operation(summary = "List chronological observation readings for an owned parent (for family trend view)")
    public List<VisitReportDto> listParentReports(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID parentId
    ) {
        return reportService.listParentReports(principal, parentId);
    }
}
