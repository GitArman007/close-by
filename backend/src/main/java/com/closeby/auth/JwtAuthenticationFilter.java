package com.closeby.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            AuthPrincipal parsed = jwtService.parseToken(token);
            userRepository.findById(parsed.userId())
                    .filter(User::isActive)
                    .ifPresent(user -> {
                        AuthPrincipal verifiedPrincipal = new AuthPrincipal(
                                user.getId(),
                                user.getEmail(),
                                user.getFullName(),
                                user.getRole(),
                                user.getClinicId()
                        );
                        var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                        var authentication = new UsernamePasswordAuthenticationToken(
                                verifiedPrincipal,
                                null,
                                authorities
                        );
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
