package com.closeby.clinic;

import com.closeby.auth.AuthPrincipal;
import com.closeby.clinic.AdminAnalyticsService.PlatformAnalyticsDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
@Tag(name = "Platform Admin — Analytics", description = "Aggregated operational metrics (no private medical details exposed)")
public class PlatformAdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;

    public PlatformAdminAnalyticsController(AdminAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @Operation(summary = "Get visits per week, average time-to-assign, repeat bookings, and clinics by status")
    public PlatformAnalyticsDto getAnalytics(@AuthenticationPrincipal AuthPrincipal principal) {
        return analyticsService.getPlatformAnalytics(principal);
    }
}
