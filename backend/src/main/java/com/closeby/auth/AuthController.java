package com.closeby.auth;

import com.closeby.auth.AuthDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Registration, JWT login, and current user session")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/family")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a family account")
    public AuthResponse registerFamily(@Valid @RequestBody RegisterFamilyRequest request) {
        return authService.registerFamily(request);
    }

    @PostMapping("/register/clinic")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new Bhopal clinic (starts in PENDING status) and its primary Clinic Admin")
    public AuthResponse registerClinic(@Valid @RequestBody RegisterClinicRequest request) {
        return authService.registerClinic(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email and password to receive a signed JWT")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    @Operation(summary = "Return the authenticated user profile, role, and clinic summary")
    public UserSummaryDto me(@AuthenticationPrincipal AuthPrincipal principal) {
        return authService.getCurrentUser(principal);
    }
}
