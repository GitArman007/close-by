package com.closeby.clinic;

import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.UserRole;
import com.closeby.visit.Visit;
import com.closeby.visit.VisitRepository;
import com.closeby.visit.VisitStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {

    public record WeeklyVisitBucket(String weekLabel, LocalDate weekStart, long visitCount) {}
    public record StatusCount(String status, long count) {}

    public record PlatformAnalyticsDto(
            long totalVisits,
            double averageMinutesToAssign,
            long repeatBookingParentsCount,
            double repeatBookingRatePercent,
            List<WeeklyVisitBucket> visitsPerWeek,
            List<StatusCount> clinicsByStatus,
            List<StatusCount> visitsByStatus
    ) {}

    private final ClinicRepository clinicRepository;
    private final VisitRepository visitRepository;

    public AdminAnalyticsService(ClinicRepository clinicRepository, VisitRepository visitRepository) {
        this.clinicRepository = clinicRepository;
        this.visitRepository = visitRepository;
    }

    @Transactional(readOnly = true)
    public PlatformAnalyticsDto getPlatformAnalytics(AuthPrincipal principal) {
        principal.requireRole(UserRole.PLATFORM_ADMIN);

        List<Visit> allVisits = visitRepository.findAll();

        // Average time to assign (in minutes) across visits that have both createdAt and assignedAt
        double avgMinutesToAssign = allVisits.stream()
                .filter(v -> v.getAssignedAt() != null && v.getCreatedAt() != null)
                .mapToDouble(v -> Math.max(0.0, Duration.between(v.getCreatedAt(), v.getAssignedAt()).toMinutes()))
                .average()
                .orElse(0.0);

        // Repeat bookings: parents with 2+ visits
        Map<UUID, Long> visitsPerParent = allVisits.stream()
                .collect(Collectors.groupingBy(Visit::getParentId, Collectors.counting()));
        long repeatParents = visitsPerParent.values().stream().filter(c -> c >= 2).count();
        double repeatRate = visitsPerParent.isEmpty()
                ? 0.0
                : Math.round((repeatParents * 1000.0) / visitsPerParent.size()) / 10.0;

        // Visits per week over last 8 weeks
        LocalDate currentWeekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
        Map<LocalDate, Long> countsByWeek = new LinkedHashMap<>();
        for (int i = 7; i >= 0; i--) {
            countsByWeek.put(currentWeekStart.minusWeeks(i), 0L);
        }
        for (Visit v : allVisits) {
            LocalDate wk = v.getScheduledDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            if (countsByWeek.containsKey(wk)) {
                countsByWeek.put(wk, countsByWeek.get(wk) + 1);
            }
        }
        List<WeeklyVisitBucket> weeklyBuckets = countsByWeek.entrySet().stream()
                .map(e -> new WeeklyVisitBucket(e.getKey().format(fmt), e.getKey(), e.getValue()))
                .toList();

        List<StatusCount> clinicsByStatus = Arrays.stream(ClinicStatus.values())
                .map(s -> new StatusCount(s.name(), clinicRepository.countByStatus(s)))
                .toList();

        Map<VisitStatus, Long> visitCounts = allVisits.stream()
                .collect(Collectors.groupingBy(Visit::getStatus, Collectors.counting()));
        List<StatusCount> visitsByStatus = Arrays.stream(VisitStatus.values())
                .map(s -> new StatusCount(s.name(), visitCounts.getOrDefault(s, 0L)))
                .toList();

        return new PlatformAnalyticsDto(
                allVisits.size(),
                Math.round(avgMinutesToAssign * 10.0) / 10.0,
                repeatParents,
                repeatRate,
                weeklyBuckets,
                clinicsByStatus,
                visitsByStatus
        );
    }
}
