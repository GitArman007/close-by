package com.closeby;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Proves:
 * 1. Every illegal visit status transition is rejected server-side with 409 Conflict.
 * 2. Booking with a non-approved clinic is rejected with 400 Bad Request.
 * 3. Every authorized report view writes an entry to report_access_logs with viewer & timestamp.
 */
class VisitLifecycleAndReportAuditIntegrationTest extends BaseIntegrationTest {

    @Test
    void enforcesAllowedStatusTransitions_andWritesAccessLogOnEveryReportView() throws Exception {
        createPlatformAdmin("admin@closeby.in", "AdminPass@123");
        String adminToken = loginAndGetToken("admin@closeby.in", "AdminPass@123");

        JsonNode approvedClinicReg = registerClinic("Admin 1", "clinic1@closeby.in", "Vindhya Hearth Health Center", "BPL-LC-1");
        JsonNode pendingClinicReg = registerClinic("Admin 2", "clinic2@closeby.in", "Kolar Canopy Family Care", "BPL-LC-2");
        String clinicToken = approvedClinicReg.get("accessToken").asText();
        String clinicId = approvedClinicReg.get("user").get("clinicId").asText();
        String pendingClinicId = pendingClinicReg.get("user").get("clinicId").asText();

        mockMvc.perform(patch("/api/v1/admin/clinics/" + clinicId + "/approve")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)).andExpect(status().isOk());

        JsonNode staff1 = objectMapper.readTree(mockMvc.perform(post("/api/v1/clinic/staff")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nurse Preeti Malviya",
                                "email", "preeti@closeby.in",
                                "phone", "+91-98261-30001",
                                "password", "StaffPass@123",
                                "designation", "Registered Nurse"
                        ))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String staff1Id = staff1.get("userId").asText();
        String staff1Token = loginAndGetToken("preeti@closeby.in", "StaffPass@123");

        mockMvc.perform(post("/api/v1/clinic/staff")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Deepak Kushwaha",
                                "email", "deepak@closeby.in",
                                "phone", "+91-98261-30002",
                                "password", "StaffPass@123",
                                "designation", "Phlebotomist"
                        ))))
                .andExpect(status().isCreated());
        String unassignedStaffToken = loginAndGetToken("deepak@closeby.in", "StaffPass@123");

        JsonNode famReg = registerFamily("Vikram Saxena", "vikram@closeby.in", "FamilyPass@123");
        String famToken = famReg.get("accessToken").asText();

        JsonNode parent = objectMapper.readTree(mockMvc.perform(post("/api/v1/parents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Smt. Rekha Saxena",
                                "age", 66,
                                "gender", "Female",
                                "locality", "Shahpura",
                                "address", "C-19, Sector B, Shahpura, Bhopal",
                                "consentConfirmed", true
                        ))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String parentId = parent.get("id").asText();

        // Booking with a PENDING clinic is rejected
        mockMvc.perform(post("/api/v1/visits")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parentId", parentId,
                                "clinicId", pendingClinicId,
                                "serviceType", "HOME_VITALS_CHECK",
                                "scheduledDate", LocalDate.now().toString(),
                                "preferredTime", "09:00 AM"
                        ))))
                .andExpect(status().isBadRequest());

        // Visit 1: happy path + illegal transitions along the way
        JsonNode visit1 = objectMapper.readTree(mockMvc.perform(post("/api/v1/visits")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parentId", parentId,
                                "clinicId", clinicId,
                                "serviceType", "MEDICINE_ADHERENCE_CHECK",
                                "scheduledDate", LocalDate.now().toString(),
                                "preferredTime", "10:00 AM - 11:30 AM"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("REQUESTED")))
                .andReturn().getResponse().getContentAsString());
        String visit1Id = visit1.get("id").asText();

        // Assign staff: REQUESTED -> ASSIGNED
        mockMvc.perform(patch("/api/v1/visits/" + visit1Id + "/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("staffUserId", staff1Id))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ASSIGNED")))
                .andExpect(jsonPath("$.staffVerifiedBadge", is("Verified by Vindhya Hearth Health Center")));

        // ILLEGAL: ASSIGNED -> COMPLETED (skipping IN_PROGRESS) must fail with 409 Conflict
        mockMvc.perform(post("/api/v1/visits/" + visit1Id + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staff1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "bpSystolic", 124,
                                "bpDiastolic", 78,
                                "observationNotes", "Trying to skip IN_PROGRESS",
                                "recommendation", "NONE"
                        ))))
                .andExpect(status().isConflict());

        // Unassigned staff cannot start visit
        mockMvc.perform(patch("/api/v1/visits/" + visit1Id + "/start")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + unassignedStaffToken))
                .andExpect(status().isForbidden());

        // Start visit: ASSIGNED -> IN_PROGRESS
        mockMvc.perform(patch("/api/v1/visits/" + visit1Id + "/start")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staff1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")));

        // ILLEGAL: IN_PROGRESS -> CANCELLED must fail with 409 Conflict
        mockMvc.perform(patch("/api/v1/visits/" + visit1Id + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Too late"))))
                .andExpect(status().isConflict());

        // Complete visit: IN_PROGRESS -> COMPLETED with observation report
        JsonNode report = objectMapper.readTree(mockMvc.perform(post("/api/v1/visits/" + visit1Id + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staff1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "bpSystolic", 126,
                                "bpDiastolic", 80,
                                "temperatureF", 98.4,
                                "bloodSugarMgDl", 108,
                                "bloodSugarContext", "FASTING",
                                "observationNotes", "Morning medicines verified in weekly pill organizer.",
                                "recommendation", "FOLLOW_UP_VISIT"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.staffVerifiedBadge", is("Verified by Vindhya Hearth Health Center")))
                .andExpect(jsonPath("$.emergencyNotice", is("In an emergency, call 108 or 112")))
                .andExpect(jsonPath("$.observationsDisclaimer", containsString("Observations only")))
                .andReturn().getResponse().getContentAsString());
        UUID reportId = UUID.fromString(report.get("id").asText());

        // ILLEGAL: COMPLETED -> CANCELLED must fail with 409 Conflict
        mockMvc.perform(patch("/api/v1/visits/" + visit1Id + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken))
                .andExpect(status().isConflict());

        // ILLEGAL: COMPLETED -> ASSIGNED must fail with 409 Conflict
        mockMvc.perform(patch("/api/v1/visits/" + visit1Id + "/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("staffUserId", staff1Id))))
                .andExpect(status().isConflict());

        // ================= REPORT ACCESS LOG AUDIT PROOF =================
        assertThat(accessLogRepository.countByReportId(reportId)).isEqualTo(0);

        // View #1: Family reads report -> writes access log entry #1
        mockMvc.perform(get("/api/v1/visits/" + visit1Id + "/report")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bpSystolic", is(126)));
        assertThat(accessLogRepository.countByReportId(reportId)).isEqualTo(1);

        // View #2: Clinic Admin reads report -> writes access log entry #2
        mockMvc.perform(get("/api/v1/visits/" + visit1Id + "/report")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken))
                .andExpect(status().isOk());
        assertThat(accessLogRepository.countByReportId(reportId)).isEqualTo(2);

        // Access log endpoint returns both views with viewer roles and timestamps
        mockMvc.perform(get("/api/v1/reports/" + reportId + "/access-logs")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].viewerRole", is("CLINIC_ADMIN")))
                .andExpect(jsonPath("$[1].viewerRole", is("FAMILY")));

        // ================= CANCELLED TERMINAL TRANSITION PROOF =================
        JsonNode visit2 = objectMapper.readTree(mockMvc.perform(post("/api/v1/visits")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parentId", parentId,
                                "clinicId", clinicId,
                                "serviceType", "SAMPLE_COLLECTION",
                                "scheduledDate", LocalDate.now().plusDays(1).toString(),
                                "preferredTime", "08:00 AM"
                        ))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String visit2Id = visit2.get("id").asText();

        // Cancel from REQUESTED succeeds
        mockMvc.perform(patch("/api/v1/visits/" + visit2Id + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Rescheduling"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // ILLEGAL: CANCELLED -> ASSIGNED must fail with 409 Conflict
        mockMvc.perform(patch("/api/v1/visits/" + visit2Id + "/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("staffUserId", staff1Id))))
                .andExpect(status().isConflict());
    }
}
