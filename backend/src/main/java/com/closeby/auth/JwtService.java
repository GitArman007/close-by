package com.closeby.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationSeconds;

    public JwtService(
            @Value("${closeby.jwt.secret}") String secret,
            @Value("${closeby.jwt.expiration-seconds:86400}") long expirationSeconds
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("closeby.jwt.secret must be at least 32 bytes for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(expirationSeconds);

        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry));

        if (user.getClinicId() != null) {
            builder.claim("clinicId", user.getClinicId().toString());
        }

        return builder.signWith(signingKey).compact();
    }

    public AuthPrincipal parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        UUID userId = UUID.fromString(claims.getSubject());
        String email = claims.get("email", String.class);
        String fullName = claims.get("fullName", String.class);
        UserRole role = UserRole.valueOf(claims.get("role", String.class));
        String clinicIdRaw = claims.get("clinicId", String.class);
        UUID clinicId = clinicIdRaw != null ? UUID.fromString(clinicIdRaw) : null;

        return new AuthPrincipal(userId, email, fullName, role, clinicId);
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
