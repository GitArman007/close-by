package com.closeby.visit;

import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.User;
import com.closeby.auth.UserRepository;
import com.closeby.auth.UserRole;
import com.closeby.clinic.Clinic;
import com.closeby.clinic.ClinicRepository;
import com.closeby.clinic.ClinicService;
import com.closeby.clinic.ClinicStatus;
import com.closeby.common.ClinicalSafetyConstants;
import com.closeby.common.CloseByException;
import com.closeby.parent.Parent;
import com.closeby.parent.ParentRepository;
import com.closeby.parent.ParentService;
import com.closeby.staff.ClinicStaffProfile;
import com.closeby.staff.ClinicStaffProfileRepository;
import com.closeby.visit.VisitDtos.CreateVisitRequest;
import com.closeby.visit.VisitDtos.VisitDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class VisitService {

    private final VisitRepository visitRepository;
    private final ParentService parentService;
    private final ParentRepository parentRepository;
    private final ClinicService clinicService;
    private final ClinicRepository clinicRepository;
    private final ClinicStaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;

    public VisitService(
            VisitRepository visitRepository,
            ParentService parentService,
            ParentRepository parentRepository,
            ClinicService clinicService,
            ClinicRepository clinicRepository,
            ClinicStaffProfileRepository staffProfileRepository,
            UserRepository userRepository
    ) {
        this.visitRepository = visitRepository;
        this.parentService = parentService;
        this.parentRepository = parentRepository;
        this.clinicService = clinicService;
        this.clinicRepository = clinicRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public VisitDto createVisit(AuthPrincipal principal, CreateVisitRequest request) {
        principal.requireRole(UserRole.FAMILY);

        // Service-layer family ownership check + consent check
        Parent parent = parentService.requireOwnedParent(principal, request.parentId());
        if (!parent.isConsentConfirmed() || parent.getConsentConfirmedAt() == null) {
            throw CloseByException.badRequest("Parent consent is required before booking a visit.");
        }

        Clinic clinic = clinicService.findClinicOrThrow(request.clinicId());
        if (clinic.getStatus() != ClinicStatus.APPROVED) {
            throw CloseByException.badRequest("Home visits can only be booked with an approved Bhopal clinic.");
        }

        String address = (request.visitAddress() != null && !request.visitAddress().trim().isEmpty())
                ? request.visitAddress().trim()
                : parent.getAddress();

        Instant now = Instant.now();
        Visit visit = new Visit(
                UUID.randomUUID(),
                principal.userId(),
                parent.getId(),
                clinic.getId(),
                request.serviceType(),
                request.scheduledDate(),
                request.preferredTime().trim(),
                address,
                trimNullable(request.instructions()),
                now
        );
        visitRepository.save(visit);
        return toDtos(List.of(visit)).getFirst();
    }

    @Transactional(readOnly = true)
    public List<VisitDto> listVisits(AuthPrincipal principal, VisitStatus status) {
        principal.requireRole(UserRole.FAMILY, UserRole.CLINIC_ADMIN, UserRole.CLINIC_STAFF);

        List<Visit> visits = switch (principal.role()) {
            case FAMILY -> status != null
                    ? visitRepository.findByFamilyUserIdAndStatusOrderByCreatedAtDesc(principal.userId(), status)
                    : visitRepository.findByFamilyUserIdOrderByCreatedAtDesc(principal.userId());
            case CLINIC_ADMIN -> {
                UUID clinicId = principal.requireClinicId();
                yield status != null
                        ? visitRepository.findByClinicIdAndStatusOrderByCreatedAtDesc(clinicId, status)
                        : visitRepository.findByClinicIdOrderByCreatedAtDesc(clinicId);
            }
            case CLINIC_STAFF -> status != null
                    ? visitRepository.findByAssignedStaffIdAndStatusOrderByScheduledDateAsc(principal.userId(), status)
                    : visitRepository.findByAssignedStaffIdOrderByScheduledDateAsc(principal.userId());
            default -> throw CloseByException.forbidden("Unsupported role for visit listing.");
        };

        return toDtos(visits);
    }

    @Transactional(readOnly = true)
    public VisitDto getVisit(AuthPrincipal principal, UUID visitId) {
        Visit visit = requireAuthorizedVisit(principal, visitId);
        return toDtos(List.of(visit)).getFirst();
    }

    @Transactional
    public VisitDto assignStaff(AuthPrincipal principal, UUID visitId, UUID staffUserId) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID callerClinicId = principal.requireClinicId();

        Visit visit = findVisitOrThrow(visitId);
        if (!visit.getClinicId().equals(callerClinicId)) {
            throw CloseByException.forbidden("You cannot assign staff to a visit belonging to another clinic.");
        }

        ClinicStaffProfile staffProfile = staffProfileRepository.findByUserId(staffUserId)
                .orElseThrow(() -> CloseByException.notFound("Selected clinic staff member was not found."));
        if (!staffProfile.getClinicId().equals(callerClinicId)) {
            throw CloseByException.forbidden("You can only assign verified staff from your own clinic.");
        }
        User staffUser = userRepository.findById(staffUserId)
                .orElseThrow(() -> CloseByException.notFound("Selected staff user account was not found."));
        if (!staffProfile.isActive() || !staffUser.isActive()) {
            throw CloseByException.badRequest("Selected clinic staff member is inactive.");
        }

        visit.assignStaff(staffUserId, Instant.now());
        visitRepository.save(visit);
        return toDtos(List.of(visit)).getFirst();
    }

    @Transactional
    public VisitDto startVisit(AuthPrincipal principal, UUID visitId) {
        principal.requireRole(UserRole.CLINIC_STAFF);
        UUID callerClinicId = principal.requireClinicId();

        Visit visit = findVisitOrThrow(visitId);
        if (!visit.getClinicId().equals(callerClinicId) || !principal.userId().equals(visit.getAssignedStaffId())) {
            throw CloseByException.forbidden("Only the assigned clinic staff member can start this visit.");
        }

        visit.start(Instant.now());
        visitRepository.save(visit);
        return toDtos(List.of(visit)).getFirst();
    }

    @Transactional
    public VisitDto cancelVisit(AuthPrincipal principal, UUID visitId, String reason) {
        principal.requireRole(UserRole.FAMILY, UserRole.CLINIC_ADMIN);
        Visit visit = findVisitOrThrow(visitId);

        if (principal.role() == UserRole.FAMILY && !visit.getFamilyUserId().equals(principal.userId())) {
            throw CloseByException.forbidden("You cannot cancel another family's visit.");
        }
        if (principal.role() == UserRole.CLINIC_ADMIN && !visit.getClinicId().equals(principal.requireClinicId())) {
            throw CloseByException.forbidden("You cannot cancel another clinic's visit.");
        }

        visit.cancel(trimNullable(reason), Instant.now());
        visitRepository.save(visit);
        return toDtos(List.of(visit)).getFirst();
    }

    /**
     * Service-layer authorization & tenant isolation check shared with ReportService and AuditService.
     */
    public Visit requireAuthorizedVisit(AuthPrincipal principal, UUID visitId) {
        principal.requireRole(UserRole.FAMILY, UserRole.CLINIC_ADMIN, UserRole.CLINIC_STAFF);
        Visit visit = findVisitOrThrow(visitId);

        switch (principal.role()) {
            case FAMILY -> {
                if (!visit.getFamilyUserId().equals(principal.userId())) {
                    throw CloseByException.forbidden("You cannot access another family's visit.");
                }
            }
            case CLINIC_ADMIN -> {
                if (!visit.getClinicId().equals(principal.requireClinicId())) {
                    throw CloseByException.forbidden("You cannot access another clinic's visit.");
                }
            }
            case CLINIC_STAFF -> {
                if (!visit.getClinicId().equals(principal.requireClinicId())
                        || !principal.userId().equals(visit.getAssignedStaffId())) {
                    throw CloseByException.forbidden("You can only access visits assigned directly to you.");
                }
            }
            default -> throw CloseByException.forbidden("Access denied.");
        }
        return visit;
    }

    public Visit findVisitOrThrow(UUID visitId) {
        return visitRepository.findById(visitId)
                .orElseThrow(() -> CloseByException.notFound("Visit not found."));
    }

    private List<VisitDto> toDtos(List<Visit> visits) {
        if (visits.isEmpty()) {
            return List.of();
        }

        Set<UUID> parentIds = visits.stream().map(Visit::getParentId).collect(Collectors.toSet());
        Set<UUID> clinicIds = visits.stream().map(Visit::getClinicId).collect(Collectors.toSet());
        Set<UUID> staffIds = visits.stream()
                .map(Visit::getAssignedStaffId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, Parent> parentsById = parentRepository.findAllByIdIn(parentIds)
                .stream().collect(Collectors.toMap(Parent::getId, Function.identity()));
        Map<UUID, Clinic> clinicsById = clinicRepository.findAllById(clinicIds)
                .stream().collect(Collectors.toMap(Clinic::getId, Function.identity()));
        Map<UUID, User> staffUsersById = staffIds.isEmpty()
                ? Map.of()
                : userRepository.findAllByIdIn(staffIds)
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<UUID, ClinicStaffProfile> staffProfilesByUserId = staffIds.isEmpty()
                ? Map.of()
                : staffProfileRepository.findByUserIdIn(staffIds)
                .stream().collect(Collectors.toMap(ClinicStaffProfile::getUserId, Function.identity()));

        return visits.stream().map(v -> {
            Parent parent = parentsById.get(v.getParentId());
            Clinic clinic = clinicsById.get(v.getClinicId());
            User staffUser = v.getAssignedStaffId() != null ? staffUsersById.get(v.getAssignedStaffId()) : null;
            ClinicStaffProfile staffProfile = v.getAssignedStaffId() != null
                    ? staffProfilesByUserId.get(v.getAssignedStaffId())
                    : null;

            String clinicName = clinic != null ? clinic.getName() : "";
            String badge = staffUser != null && clinic != null
                    ? ClinicalSafetyConstants.verifiedBy(clinicName)
                    : null;

            return new VisitDto(
                    v.getId(),
                    v.getFamilyUserId(),
                    v.getParentId(),
                    parent != null ? parent.getFullName() : "",
                    parent != null ? parent.getAge() : 0,
                    parent != null ? parent.getLocality() : "",
                    v.getClinicId(),
                    clinicName,
                    clinic != null ? clinic.getLocality() : "",
                    v.getAssignedStaffId(),
                    staffUser != null ? staffUser.getFullName() : null,
                    staffProfile != null ? staffProfile.getDesignation() : null,
                    badge,
                    v.getServiceType(),
                    v.getServiceType().getDisplayLabel(),
                    v.getScheduledDate(),
                    v.getPreferredTime(),
                    v.getVisitAddress(),
                    v.getInstructions(),
                    v.getStatus(),
                    v.getCancellationReason(),
                    v.getAssignedAt(),
                    v.getStartedAt(),
                    v.getCompletedAt(),
                    v.getCreatedAt()
            );
        }).toList();
    }

    private String trimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
