package com.closeby.auth;

import com.closeby.auth.AuthDtos.*;
import com.closeby.clinic.Clinic;
import com.closeby.clinic.ClinicRepository;
import com.closeby.clinic.ClinicStatus;
import com.closeby.common.CloseByException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            ClinicRepository clinicRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.clinicRepository = clinicRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registerFamily(RegisterFamilyRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw CloseByException.conflict("An account with this email already exists.");
        }

        Instant now = Instant.now();
        User user = new User(
                UUID.randomUUID(),
                request.fullName().trim(),
                normalizedEmail,
                request.phone().trim(),
                passwordEncoder.encode(request.password()),
                UserRole.FAMILY,
                null,
                now
        );
        userRepository.save(user);
        return buildAuthResponse(user, null);
    }

    @Transactional
    public AuthResponse registerClinic(RegisterClinicRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw CloseByException.conflict("An account with this email already exists.");
        }
        String regNo = request.registrationNumber().trim();
        if (clinicRepository.existsByRegistrationNumberIgnoreCase(regNo)) {
            throw CloseByException.conflict("A clinic with this registration number already exists.");
        }

        Instant now = Instant.now();
        Clinic clinic = new Clinic(
                UUID.randomUUID(),
                request.clinicName().trim(),
                regNo,
                request.locality().trim(),
                request.address().trim(),
                request.clinicPhone().trim(),
                now
        );
        clinicRepository.save(clinic);

        User adminUser = new User(
                UUID.randomUUID(),
                request.adminFullName().trim(),
                normalizedEmail,
                request.adminPhone().trim(),
                passwordEncoder.encode(request.password()),
                UserRole.CLINIC_ADMIN,
                clinic.getId(),
                now
        );
        userRepository.save(adminUser);

        return buildAuthResponse(adminUser, clinic);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> CloseByException.unauthorized("Invalid email or password."));

        if (!user.isActive()) {
            throw CloseByException.forbidden("This account is currently deactivated.");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw CloseByException.unauthorized("Invalid email or password.");
        }

        Clinic clinic = user.getClinicId() != null
                ? clinicRepository.findById(user.getClinicId()).orElse(null)
                : null;
        return buildAuthResponse(user, clinic);
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(AuthPrincipal principal) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> CloseByException.notFound("User account not found."));
        Clinic clinic = user.getClinicId() != null
                ? clinicRepository.findById(user.getClinicId()).orElse(null)
                : null;
        return toSummary(user, clinic);
    }

    private AuthResponse buildAuthResponse(User user, Clinic clinic) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationSeconds(), toSummary(user, clinic));
    }

    private UserSummaryDto toSummary(User user, Clinic clinic) {
        String clinicName = clinic != null ? clinic.getName() : null;
        ClinicStatus clinicStatus = clinic != null ? clinic.getStatus() : null;
        return new UserSummaryDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getClinicId(),
                clinicName,
                clinicStatus
        );
    }
}
