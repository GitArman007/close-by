package com.closeby;

import com.closeby.clinic.ClinicStatus;
import com.closeby.seed.BhopalDemoDataSeeder;
import com.closeby.visit.Visit;
import com.closeby.visit.VisitStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BhopalDemoDataSeederIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BhopalDemoDataSeeder seeder;

    @Test
    void seedsFiveFictionalBhopalClinics_twelveParents_fortyVisitsAcrossAllStatuses_idempotently() throws Exception {
        seeder.seedIfEmpty();

        assertThat(clinicRepository.count()).isEqualTo(5);
        assertThat(clinicRepository.countByStatus(ClinicStatus.APPROVED)).isEqualTo(3);
        assertThat(clinicRepository.countByStatus(ClinicStatus.PENDING)).isEqualTo(1);
        assertThat(clinicRepository.countByStatus(ClinicStatus.SUSPENDED)).isEqualTo(1);

        assertThat(parentRepository.count()).isEqualTo(12);
        assertThat(parentRepository.findAll())
                .allSatisfy(p -> {
                    assertThat(p.isConsentConfirmed()).isTrue();
                    assertThat(p.getConsentConfirmedAt()).isNotNull();
                    assertThat(p.getAge()).isBetween(60, 85);
                });

        var visits = visitRepository.findAll();
        assertThat(visits).hasSize(40);

        Set<VisitStatus> statusesPresent = visits.stream()
                .map(Visit::getStatus)
                .collect(Collectors.toSet());
        assertThat(statusesPresent).containsAll(EnumSet.allOf(VisitStatus.class));

        LocalDate sixtyDaysAgo = LocalDate.now().minusDays(60);
        assertThat(visits).allSatisfy(v -> assertThat(v.getScheduledDate()).isAfterOrEqualTo(sixtyDaysAgo));

        long completedVisits = visits.stream().filter(v -> v.getStatus() == VisitStatus.COMPLETED).count();
        assertThat(reportRepository.count()).isEqualTo(completedVisits);
        assertThat(accessLogRepository.count()).isGreaterThan(0);

        // Idempotency proof: re-running does not duplicate any records
        seeder.seedIfEmpty();
        assertThat(clinicRepository.count()).isEqualTo(5);
        assertThat(parentRepository.count()).isEqualTo(12);
        assertThat(visitRepository.count()).isEqualTo(40);

        // Platform Admin analytics endpoint works on seeded dataset
        String adminToken = loginAndGetToken("admin@closeby.in", BhopalDemoDataSeeder.DEMO_PASSWORD);
        mockMvc.perform(get("/api/v1/admin/analytics")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVisits", is(40)))
                .andExpect(jsonPath("$.averageMinutesToAssign", greaterThan(0.0)))
                .andExpect(jsonPath("$.repeatBookingParentsCount", greaterThan(0)))
                .andExpect(jsonPath("$.visitsPerWeek", hasSize(8)))
                .andExpect(jsonPath("$.clinicsByStatus", hasSize(4)));
    }
}
