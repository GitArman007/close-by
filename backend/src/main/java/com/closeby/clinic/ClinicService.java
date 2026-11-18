package com.closeby.clinic;

import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.UserRole;
import com.closeby.clinic.ClinicDtos.ClinicDto;
import com.closeby.clinic.ClinicDtos.UpdateClinicProfileRequest;
import com.closeby.common.CloseByException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ClinicService {

    private final ClinicRepository clinicRepository;

    public ClinicService(ClinicRepository clinicRepository) {
        this.clinicRepository = clinicRepository;
    }

    @Transactional(readOnly = true)
    public List<ClinicDto> listAllClinicsForAdmin(AuthPrincipal principal, ClinicStatus status) {
        principal.requireRole(UserRole.PLATFORM_ADMIN);
        List<Clinic> clinics = status != null
                ? clinicRepository.findByStatusOrderByNameAsc(status)
                : clinicRepository.findAllByOrderByCreatedAtDesc();
        return clinics.stream().map(ClinicDto::from).toList();
    }

    @Transactional
    public ClinicDto approveClinic(AuthPrincipal principal, UUID clinicId) {
        principal.requireRole(UserRole.PLATFORM_ADMIN);
        Clinic clinic = findClinicOrThrow(clinicId);
        if (clinic.getStatus() == ClinicStatus.APPROVED) {
            throw CloseByException.conflict("Clinic is already approved.");
        }
        clinic.applyReviewStatus(ClinicStatus.APPROVED, null, principal.userId(), Instant.now());
        return ClinicDto.from(clinicRepository.save(clinic));
    }

    @Transactional
    public ClinicDto rejectClinic(AuthPrincipal principal, UUID clinicId, String reason) {
        principal.requireRole(UserRole.PLATFORM_ADMIN);
        Clinic clinic = findClinicOrThrow(clinicId);
        if (clinic.getStatus() != ClinicStatus.PENDING) {
            throw CloseByException.conflict("Only pending clinics can be rejected.");
        }
        clinic.applyReviewStatus(ClinicStatus.REJECTED, trimNullable(reason), principal.userId(), Instant.now());
        return ClinicDto.from(clinicRepository.save(clinic));
    }

    @Transactional
    public ClinicDto suspendClinic(AuthPrincipal principal, UUID clinicId, String reason) {
        principal.requireRole(UserRole.PLATFORM_ADMIN);
        Clinic clinic = findClinicOrThrow(clinicId);
        if (clinic.getStatus() != ClinicStatus.APPROVED) {
            throw CloseByException.conflict("Only approved clinics can be suspended.");
        }
        clinic.applyReviewStatus(ClinicStatus.SUSPENDED, trimNullable(reason), principal.userId(), Instant.now());
        return ClinicDto.from(clinicRepository.save(clinic));
    }

    @Transactional(readOnly = true)
    public List<ClinicDto> listApprovedClinics(AuthPrincipal principal) {
        principal.requireRole(UserRole.FAMILY, UserRole.PLATFORM_ADMIN);
        return clinicRepository.findByStatusOrderByNameAsc(ClinicStatus.APPROVED)
                .stream()
                .map(ClinicDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClinicDto getOwnClinicProfile(AuthPrincipal principal) {
        principal.requireRole(UserRole.CLINIC_ADMIN, UserRole.CLINIC_STAFF);
        UUID clinicId = principal.requireClinicId();
        return ClinicDto.from(findClinicOrThrow(clinicId));
    }

    @Transactional
    public ClinicDto updateOwnClinicProfile(AuthPrincipal principal, UpdateClinicProfileRequest request) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID clinicId = principal.requireClinicId();
        Clinic clinic = findClinicOrThrow(clinicId);
        clinic.updateProfile(
                request.name().trim(),
                request.locality().trim(),
                request.address().trim(),
                request.phone().trim()
        );
        return ClinicDto.from(clinicRepository.save(clinic));
    }

    public Clinic findClinicOrThrow(UUID clinicId) {
        return clinicRepository.findById(clinicId)
                .orElseThrow(() -> CloseByException.notFound("Clinic not found."));
    }

    private String trimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
