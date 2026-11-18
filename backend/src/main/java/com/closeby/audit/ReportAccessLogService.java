package com.closeby.audit;

import com.closeby.audit.AuditDtos.ReportAccessLogDto;
import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.User;
import com.closeby.auth.UserRepository;
import com.closeby.auth.UserRole;
import com.closeby.clinic.Clinic;
import com.closeby.clinic.ClinicRepository;
import com.closeby.common.CloseByException;
import com.closeby.parent.Parent;
import com.closeby.parent.ParentRepository;
import com.closeby.report.VisitReport;
import com.closeby.report.VisitReportRepository;
import com.closeby.visit.Visit;
import com.closeby.visit.VisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportAccessLogService {

    private final ReportAccessLogRepository accessLogRepository;
    private final VisitReportRepository reportRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final ClinicRepository clinicRepository;

    public ReportAccessLogService(
            ReportAccessLogRepository accessLogRepository,
            VisitReportRepository reportRepository,
            VisitRepository visitRepository,
            UserRepository userRepository,
            ParentRepository parentRepository,
            ClinicRepository clinicRepository
    ) {
        this.accessLogRepository = accessLogRepository;
        this.reportRepository = reportRepository;
        this.visitRepository = visitRepository;
        this.userRepository = userRepository;
        this.parentRepository = parentRepository;
        this.clinicRepository = clinicRepository;
    }

    @Transactional
    public void recordView(VisitReport report, AuthPrincipal viewer) {
        ReportAccessLog log = new ReportAccessLog(
                UUID.randomUUID(),
                report.getId(),
                report.getVisitId(),
                report.getClinicId(),
                viewer.userId(),
                viewer.role(),
                Instant.now()
        );
        accessLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ReportAccessLogDto> getLogsForReport(AuthPrincipal principal, UUID reportId) {
        principal.requireRole(UserRole.FAMILY, UserRole.CLINIC_ADMIN);

        VisitReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> CloseByException.notFound("Visit report not found."));
        Visit visit = visitRepository.findById(report.getVisitId())
                .orElseThrow(() -> CloseByException.notFound("Associated visit not found."));

        // Service-layer data isolation
        if (principal.role() == UserRole.FAMILY && !visit.getFamilyUserId().equals(principal.userId())) {
            throw CloseByException.forbidden("You cannot view access logs for another family's report.");
        }
        if (principal.role() == UserRole.CLINIC_ADMIN && !report.getClinicId().equals(principal.requireClinicId())) {
            throw CloseByException.forbidden("You cannot view access logs for another clinic's report.");
        }

        return toDtos(accessLogRepository.findByReportIdOrderByViewedAtDesc(reportId));
    }

    @Transactional(readOnly = true)
    public List<ReportAccessLogDto> listScopedLogs(AuthPrincipal principal) {
        principal.requireRole(UserRole.FAMILY, UserRole.CLINIC_ADMIN);

        List<ReportAccessLog> logs;
        if (principal.role() == UserRole.CLINIC_ADMIN) {
            logs = accessLogRepository.findByClinicIdOrderByViewedAtDesc(principal.requireClinicId());
        } else {
            List<UUID> familyVisitIds = visitRepository.findByFamilyUserIdOrderByCreatedAtDesc(principal.userId())
                    .stream()
                    .map(Visit::getId)
                    .toList();
            logs = familyVisitIds.isEmpty()
                    ? List.of()
                    : accessLogRepository.findByVisitIdInOrderByViewedAtDesc(familyVisitIds);
        }
        return toDtos(logs);
    }

    private List<ReportAccessLogDto> toDtos(List<ReportAccessLog> logs) {
        if (logs.isEmpty()) {
            return List.of();
        }

        Set<UUID> viewerIds = logs.stream().map(ReportAccessLog::getViewerUserId).collect(Collectors.toSet());
        Set<UUID> visitIds = logs.stream().map(ReportAccessLog::getVisitId).collect(Collectors.toSet());
        Set<UUID> clinicIds = logs.stream().map(ReportAccessLog::getClinicId).collect(Collectors.toSet());

        Map<UUID, User> usersById = userRepository.findAllByIdIn(viewerIds)
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<UUID, Visit> visitsById = visitRepository.findAllById(visitIds)
                .stream().collect(Collectors.toMap(Visit::getId, Function.identity()));
        Set<UUID> parentIds = visitsById.values().stream().map(Visit::getParentId).collect(Collectors.toSet());
        Map<UUID, Parent> parentsById = parentRepository.findAllByIdIn(parentIds)
                .stream().collect(Collectors.toMap(Parent::getId, Function.identity()));
        Map<UUID, Clinic> clinicsById = clinicRepository.findAllById(clinicIds)
                .stream().collect(Collectors.toMap(Clinic::getId, Function.identity()));

        return logs.stream().map(log -> {
            User viewer = usersById.get(log.getViewerUserId());
            Visit visit = visitsById.get(log.getVisitId());
            Parent parent = visit != null ? parentsById.get(visit.getParentId()) : null;
            Clinic clinic = clinicsById.get(log.getClinicId());
            return new ReportAccessLogDto(
                    log.getId(),
                    log.getReportId(),
                    log.getVisitId(),
                    log.getClinicId(),
                    parent != null ? parent.getFullName() : "",
                    clinic != null ? clinic.getName() : "",
                    log.getViewerUserId(),
                    viewer != null ? viewer.getFullName() : "Unknown user",
                    log.getViewerRole(),
                    log.getViewedAt()
            );
        }).toList();
    }
}
