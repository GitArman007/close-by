package com.closeby.report;

import com.closeby.audit.ReportAccessLogService;
import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.User;
import com.closeby.auth.UserRepository;
import com.closeby.auth.UserRole;
import com.closeby.clinic.Clinic;
import com.closeby.clinic.ClinicRepository;
import com.closeby.common.ClinicalSafetyConstants;
import com.closeby.common.CloseByException;
import com.closeby.parent.Parent;
import com.closeby.parent.ParentRepository;
import com.closeby.parent.ParentService;
import com.closeby.report.ReportDtos.CompleteVisitReportRequest;
import com.closeby.report.ReportDtos.VisitReportDto;
import com.closeby.staff.ClinicStaffProfile;
import com.closeby.staff.ClinicStaffProfileRepository;
import com.closeby.visit.Visit;
import com.closeby.visit.VisitRepository;
import com.closeby.visit.VisitService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final VisitReportRepository reportRepository;
    private final VisitService visitService;
    private final VisitRepository visitRepository;
    private final ParentService parentService;
    private final ParentRepository parentRepository;
    private final ClinicRepository clinicRepository;
    private final UserRepository userRepository;
    private final ClinicStaffProfileRepository staffProfileRepository;
    private final ReportAccessLogService accessLogService;

    public ReportService(
            VisitReportRepository reportRepository,
            VisitService visitService,
            VisitRepository visitRepository,
            ParentService parentService,
            ParentRepository parentRepository,
            ClinicRepository clinicRepository,
            UserRepository userRepository,
            ClinicStaffProfileRepository staffProfileRepository,
            ReportAccessLogService accessLogService
    ) {
        this.reportRepository = reportRepository;
        this.visitService = visitService;
        this.visitRepository = visitRepository;
        this.parentService = parentService;
        this.parentRepository = parentRepository;
        this.clinicRepository = clinicRepository;
        this.userRepository = userRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.accessLogService = accessLogService;
    }

    @Transactional
    public VisitReportDto completeVisitWithReport(
            AuthPrincipal principal,
            UUID visitId,
            CompleteVisitReportRequest request
    ) {
        principal.requireRole(UserRole.CLINIC_STAFF);
        UUID callerClinicId = principal.requireClinicId();

        Visit visit = visitService.findVisitOrThrow(visitId);
        if (!visit.getClinicId().equals(callerClinicId) || !principal.userId().equals(visit.getAssignedStaffId())) {
            throw CloseByException.forbidden("Only the assigned clinic staff member can complete this visit.");
        }
        if ((request.bpSystolic() == null) != (request.bpDiastolic() == null)) {
            throw CloseByException.badRequest("Both systolic and diastolic blood pressure values must be provided together.");
        }
        if (reportRepository.existsByVisitId(visitId)) {
            throw CloseByException.conflict("An observation report has already been submitted for this visit.");
        }

        Instant now = Instant.now();
        // Enforces IN_PROGRESS -> COMPLETED transition server-side
        visit.complete(now);
        visitRepository.save(visit);

        VisitReport report = new VisitReport(
                UUID.randomUUID(),
                visit.getId(),
                visit.getClinicId(),
                principal.userId(),
                request.bpSystolic(),
                request.bpDiastolic(),
                request.temperatureF(),
                request.bloodSugarMgDl(),
                request.bloodSugarMgDl() != null ? request.bloodSugarContext() : null,
                request.observationNotes().trim(),
                request.recommendation(),
                now
        );
        reportRepository.save(report);

        return toDtos(List.of(report)).getFirst();
    }

    /**
     * Reads a visit report with strict service-layer isolation and ALWAYS writes an append-only
     * entry to report_access_logs for every authorized view.
     */
    @Transactional
    public VisitReportDto getReportForVisit(AuthPrincipal principal, UUID visitId) {
        // Throws 403 if caller belongs to another clinic, another family, or is not the assigned staff
        visitService.requireAuthorizedVisit(principal, visitId);

        VisitReport report = reportRepository.findByVisitId(visitId)
                .orElseThrow(() -> CloseByException.notFound("No observation report has been published for this visit yet."));

        accessLogService.recordView(report, principal);
        return toDtos(List.of(report)).getFirst();
    }

    @Transactional(readOnly = true)
    public List<VisitReportDto> listOwnClinicReports(AuthPrincipal principal) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID clinicId = principal.requireClinicId();
        return toDtos(reportRepository.findByClinicIdOrderByRecordedAtDesc(clinicId));
    }

    @Transactional(readOnly = true)
    public List<VisitReportDto> listParentReports(AuthPrincipal principal, UUID parentId) {
        principal.requireRole(UserRole.FAMILY);
        // Service-layer family ownership check
        parentService.requireOwnedParent(principal, parentId);

        List<UUID> visitIds = visitRepository.findByParentIdOrderByCreatedAtDesc(parentId)
                .stream()
                .map(Visit::getId)
                .toList();
        if (visitIds.isEmpty()) {
            return List.of();
        }
        return toDtos(reportRepository.findByVisitIdInOrderByRecordedAtAsc(visitIds));
    }

    private List<VisitReportDto> toDtos(List<VisitReport> reports) {
        if (reports.isEmpty()) {
            return List.of();
        }

        Set<UUID> visitIds = reports.stream().map(VisitReport::getVisitId).collect(Collectors.toSet());
        Set<UUID> clinicIds = reports.stream().map(VisitReport::getClinicId).collect(Collectors.toSet());
        Set<UUID> staffIds = reports.stream().map(VisitReport::getRecordedByStaffId).collect(Collectors.toSet());

        Map<UUID, Visit> visitsById = visitRepository.findAllById(visitIds)
                .stream().collect(Collectors.toMap(Visit::getId, Function.identity()));
        Set<UUID> parentIds = visitsById.values().stream().map(Visit::getParentId).collect(Collectors.toSet());

        Map<UUID, Parent> parentsById = parentRepository.findAllByIdIn(parentIds)
                .stream().collect(Collectors.toMap(Parent::getId, Function.identity()));
        Map<UUID, Clinic> clinicsById = clinicRepository.findAllById(clinicIds)
                .stream().collect(Collectors.toMap(Clinic::getId, Function.identity()));
        Map<UUID, User> staffUsersById = userRepository.findAllByIdIn(staffIds)
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<UUID, ClinicStaffProfile> staffProfilesByUserId = staffProfileRepository.findByUserIdIn(staffIds)
                .stream().collect(Collectors.toMap(ClinicStaffProfile::getUserId, Function.identity()));

        return reports.stream().map(r -> {
            Visit visit = visitsById.get(r.getVisitId());
            Parent parent = visit != null ? parentsById.get(visit.getParentId()) : null;
            Clinic clinic = clinicsById.get(r.getClinicId());
            User staff = staffUsersById.get(r.getRecordedByStaffId());
            ClinicStaffProfile profile = staffProfilesByUserId.get(r.getRecordedByStaffId());
            String clinicName = clinic != null ? clinic.getName() : "";

            return new VisitReportDto(
                    r.getId(),
                    r.getVisitId(),
                    r.getClinicId(),
                    clinicName,
                    clinic != null ? clinic.getLocality() : "",
                    visit != null ? visit.getParentId() : null,
                    parent != null ? parent.getFullName() : "",
                    parent != null ? parent.getAge() : 0,
                    visit != null ? visit.getServiceType() : null,
                    visit != null ? visit.getServiceType().getDisplayLabel() : "",
                    visit != null ? visit.getScheduledDate() : null,
                    r.getRecordedByStaffId(),
                    staff != null ? staff.getFullName() : "",
                    profile != null ? profile.getDesignation() : "",
                    ClinicalSafetyConstants.verifiedBy(clinicName),
                    r.getBpSystolic(),
                    r.getBpDiastolic(),
                    r.getTemperatureF(),
                    r.getBloodSugarMgDl(),
                    r.getBloodSugarContext(),
                    r.getObservationNotes(),
                    r.getRecommendation(),
                    r.getRecordedAt(),
                    ClinicalSafetyConstants.OBSERVATIONS_DISCLAIMER,
                    ClinicalSafetyConstants.EMERGENCY_NOTICE
            );
        }).toList();
    }
}
