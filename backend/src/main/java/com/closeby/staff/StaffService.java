package com.closeby.staff;

import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.User;
import com.closeby.auth.UserRepository;
import com.closeby.auth.UserRole;
import com.closeby.clinic.Clinic;
import com.closeby.clinic.ClinicService;
import com.closeby.clinic.ClinicStatus;
import com.closeby.common.ClinicalSafetyConstants;
import com.closeby.common.CloseByException;
import com.closeby.staff.StaffDtos.CreateStaffRequest;
import com.closeby.staff.StaffDtos.StaffDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StaffService {

    private final ClinicStaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final ClinicService clinicService;
    private final PasswordEncoder passwordEncoder;

    public StaffService(
            ClinicStaffProfileRepository staffProfileRepository,
            UserRepository userRepository,
            ClinicService clinicService,
            PasswordEncoder passwordEncoder
    ) {
        this.staffProfileRepository = staffProfileRepository;
        this.userRepository = userRepository;
        this.clinicService = clinicService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<StaffDto> listOwnClinicStaff(AuthPrincipal principal) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID clinicId = principal.requireClinicId();
        Clinic clinic = clinicService.findClinicOrThrow(clinicId);

        List<ClinicStaffProfile> profiles = staffProfileRepository.findByClinicIdOrderByVerifiedAtDesc(clinicId);
        Map<UUID, User> usersById = userRepository.findAllByIdIn(
                profiles.stream().map(ClinicStaffProfile::getUserId).toList()
        ).stream().collect(Collectors.toMap(User::getId, Function.identity()));

        return profiles.stream()
                .map(profile -> toDto(profile, usersById.get(profile.getUserId()), clinic))
                .toList();
    }

    @Transactional(readOnly = true)
    public StaffDto getOwnClinicStaff(AuthPrincipal principal, UUID staffUserId) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID callerClinicId = principal.requireClinicId();

        ClinicStaffProfile profile = staffProfileRepository.findByUserId(staffUserId)
                .orElseThrow(() -> CloseByException.notFound("Clinic staff member not found."));

        // Service-layer clinic isolation
        if (!profile.getClinicId().equals(callerClinicId)) {
            throw CloseByException.forbidden("You cannot access staff belonging to another clinic.");
        }

        User user = userRepository.findById(staffUserId)
                .orElseThrow(() -> CloseByException.notFound("Staff user account not found."));
        Clinic clinic = clinicService.findClinicOrThrow(callerClinicId);
        return toDto(profile, user, clinic);
    }

    @Transactional
    public StaffDto createStaff(AuthPrincipal principal, CreateStaffRequest request) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID clinicId = principal.requireClinicId();
        Clinic clinic = clinicService.findClinicOrThrow(clinicId);

        if (clinic.getStatus() != ClinicStatus.APPROVED) {
            throw CloseByException.forbidden("Only approved clinics can add verified staff members.");
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw CloseByException.conflict("An account with this email already exists.");
        }

        Instant now = Instant.now();
        User staffUser = new User(
                UUID.randomUUID(),
                request.fullName().trim(),
                normalizedEmail,
                request.phone().trim(),
                passwordEncoder.encode(request.password()),
                UserRole.CLINIC_STAFF,
                clinicId,
                now
        );
        userRepository.save(staffUser);

        ClinicStaffProfile profile = new ClinicStaffProfile(
                UUID.randomUUID(),
                staffUser.getId(),
                clinicId,
                request.designation().trim(),
                now
        );
        staffProfileRepository.save(profile);

        return toDto(profile, staffUser, clinic);
    }

    @Transactional
    public StaffDto updateStaffStatus(AuthPrincipal principal, UUID staffUserId, boolean active) {
        principal.requireRole(UserRole.CLINIC_ADMIN);
        UUID callerClinicId = principal.requireClinicId();

        ClinicStaffProfile profile = staffProfileRepository.findByUserId(staffUserId)
                .orElseThrow(() -> CloseByException.notFound("Clinic staff member not found."));

        // Service-layer clinic isolation
        if (!profile.getClinicId().equals(callerClinicId)) {
            throw CloseByException.forbidden("You cannot modify staff belonging to another clinic.");
        }

        User user = userRepository.findById(staffUserId)
                .orElseThrow(() -> CloseByException.notFound("Staff user account not found."));

        profile.setActive(active);
        user.setActive(active);
        staffProfileRepository.save(profile);
        userRepository.save(user);

        Clinic clinic = clinicService.findClinicOrThrow(callerClinicId);
        return toDto(profile, user, clinic);
    }

    private StaffDto toDto(ClinicStaffProfile profile, User user, Clinic clinic) {
        return new StaffDto(
                user.getId(),
                profile.getId(),
                clinic.getId(),
                clinic.getName(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                profile.getDesignation(),
                profile.isVerifiedByClinic(),
                ClinicalSafetyConstants.verifiedBy(clinic.getName()),
                profile.getVerifiedAt(),
                profile.isActive() && user.isActive()
        );
    }
}
