package com.closeby.audit;

import com.closeby.audit.AuditDtos.ReportAccessLogDto;
import com.closeby.auth.AuthPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasAnyRole('FAMILY', 'CLINIC_ADMIN')")
@Tag(name = "Report Access Logs", description = "Append-only audit trail recording who viewed which visit report and when")
public class ReportAccessLogController {

    private final ReportAccessLogService accessLogService;

    public ReportAccessLogController(ReportAccessLogService accessLogService) {
        this.accessLogService = accessLogService;
    }

    @GetMapping("/reports/{reportId}/access-logs")
    @Operation(summary = "List access log entries for a specific report (strictly scoped to owner family or clinic)")
    public List<ReportAccessLogDto> getLogsForReport(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID reportId
    ) {
        return accessLogService.getLogsForReport(principal, reportId);
    }

    @GetMapping("/access-logs")
    @Operation(summary = "List report access logs scoped to the authenticated family or clinic")
    public List<ReportAccessLogDto> listScopedLogs(@AuthenticationPrincipal AuthPrincipal principal) {
        return accessLogService.listScopedLogs(principal);
    }
}
