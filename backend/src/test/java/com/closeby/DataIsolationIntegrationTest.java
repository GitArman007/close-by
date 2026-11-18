package com.closeby;

import com.closeby.audit.ReportAccessLogService;
import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.UserRole;
import com.closeby.common.CloseByException;
import com.closeby.parent.ParentService;
import com.closeby.report.ReportService;
import com.closeby.staff.StaffService;
import com.closeby.visit.VisitService;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Proves strict data isolation at BOTH the HTTP/Controller layer and directly at the Service layer:
 * 1. A clinic can never read or mutate another clinic's staff, visits, reports, or access logs.
 * 2. A family can never read or mutate another family's parent, visits, reports, or access logs.
 */
class DataIsolationIntegrationTest extends BaseIntegrationTest {

    @Autowired private ParentService parentService;
    @Autowired private StaffService staffService;
    @Autowired private VisitService visitService;
    @Autowired private ReportService reportService;
    @Autowired private ReportAccessLogService accessLogService;

    @Test
    void clinicIsolationAndFamilyIsolation_enforcedInBothHttpAndServiceLayer() throws Exception {
        createPlatformAdmin("admin@closeby.in", "AdminPass@123");
        String adminToken = loginAndGetToken("admin@closeby.in", "AdminPass@123");

        // Register and approve Clinic A and Clinic B
        JsonNode clinicAReg = registerClinic("Admin A", "clinicA@closeby.in", "Lakeview Homecare Clinic", "BPL-ISO-A");
        JsonNode clinicBReg = registerClinic("Admin B", "clinicB@closeby.in", "Bada Talab Care Collective", "BPL-ISO-B");

        String clinicAToken = clinicAReg.get("accessToken").asText();
        String clinicBToken = clinicBReg.get("accessToken").asText();
        UUID clinicAId = UUID.fromString(clinicAReg.get("user").get("clinicId").asText());
        UUID clinicBId = UUID.fromString(clinicBReg.get("user").get("clinicId").asText());
        UUID clinicBAdminUserId = UUID.fromString(clinicBReg.get("user").get("id").asText());

        mockMvc.perform(patch("/api/v1/admin/clinics/" + clinicAId + "/approve")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/admin/clinics/" + clinicBId + "/approve")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)).andExpect(status().isOk());

        // Clinic A creates Staff A; Clinic B creates Staff B
        JsonNode staffA = objectMapper.readTree(mockMvc.perform(post("/api/v1/clinic/staff")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nurse Sunita",
                                "email", "staffA@closeby.in",
                                "phone", "+91-98261-10010",
                                "password", "StaffPass@123",
                                "designation", "Registered Nurse"
                        ))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        UUID staffAId = UUID.fromString(staffA.get("userId").asText());
        String staffAToken = loginAndGetToken("staffA@closeby.in", "StaffPass@123");

        JsonNode staffB = objectMapper.readTree(mockMvc.perform(post("/api/v1/clinic/staff")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nurse Kavita",
                                "email", "staffB@closeby.in",
                                "phone", "+91-98261-10011",
                                "password", "StaffPass@123",
                                "designation", "Registered Nurse"
                        ))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        UUID staffBId = UUID.fromString(staffB.get("userId").asText());

        // Register Family A and Family B
        JsonNode famAReg = registerFamily("Rohan Sharma", "rohan@closeby.in", "FamilyPass@123");
        JsonNode famBReg = registerFamily("Ananya Joshi", "ananya@closeby.in", "FamilyPass@123");
        String famAToken = famAReg.get("accessToken").asText();
        String famBToken = famBReg.get("accessToken").asText();
        UUID famBUserId = UUID.fromString(famBReg.get("user").get("id").asText());

        // Consent check: adding parent with consentConfirmed=false fails with 400
        mockMvc.perform(post("/api/v1/parents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Smt. Meera Sharma",
                                "age", 68,
                                "gender", "Female",
                                "locality", "Arera Colony",
                                "address", "E-4/72, Arera Colony, Bhopal",
                                "consentConfirmed", false
                        ))))
                .andExpect(status().isBadRequest());

        // Family A creates Parent A with confirmed consent -> saves server UTC timestamp
        JsonNode parentA = objectMapper.readTree(mockMvc.perform(post("/api/v1/parents")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Smt. Meera Sharma",
                                "age", 68,
                                "gender", "Female",
                                "locality", "Arera Colony",
                                "address", "E-4/72, Arera Colony, Bhopal",
                                "consentConfirmed", true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consentConfirmed", is(true)))
                .andExpect(jsonPath("$.consentConfirmedAt", notNullValue()))
                .andReturn().getResponse().getContentAsString());
        UUID parentAId = UUID.fromString(parentA.get("id").asText());

        // Family A requests a visit at Clinic A, Clinic A assigns Staff A, Staff A starts & completes it
        JsonNode visitA = objectMapper.readTree(mockMvc.perform(post("/api/v1/visits")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parentId", parentAId.toString(),
                                "clinicId", clinicAId.toString(),
                                "serviceType", "HOME_VITALS_CHECK",
                                "scheduledDate", LocalDate.now().toString(),
                                "preferredTime", "09:00 AM - 10:30 AM"
                        ))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        UUID visitAId = UUID.fromString(visitA.get("id").asText());

        // Clinic A cannot assign Clinic B's staff to Clinic A's visit
        mockMvc.perform(patch("/api/v1/visits/" + visitAId + "/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("staffUserId", staffBId.toString()))))
                .andExpect(status().isForbidden());

        // Clinic B cannot assign staff to Clinic A's visit
        mockMvc.perform(patch("/api/v1/visits/" + visitAId + "/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("staffUserId", staffBId.toString()))))
                .andExpect(status().isForbidden());

        // Complete visit A legitimately so report exists
        mockMvc.perform(patch("/api/v1/visits/" + visitAId + "/assign")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("staffUserId", staffAId.toString()))))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/visits/" + visitAId + "/start")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffAToken))
                .andExpect(status().isOk());
        JsonNode reportA = objectMapper.readTree(mockMvc.perform(post("/api/v1/visits/" + visitAId + "/complete")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "bpSystolic", 128,
                                "bpDiastolic", 82,
                                "temperatureF", 98.4,
                                "bloodSugarMgDl", 104,
                                "bloodSugarContext", "FASTING",
                                "observationNotes", "Steady morning readings after seated rest.",
                                "recommendation", "NONE"
                        ))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        UUID reportAId = UUID.fromString(reportA.get("id").asText());

        // ================= HTTP LAYER ISOLATION PROOFS =================

        // Clinic B cannot list Clinic A's visits, reports, or staff
        mockMvc.perform(get("/api/v1/visits").header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/reports").header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/clinic/staff/" + staffAId).header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/visits/" + visitAId).header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/visits/" + visitAId + "/report").header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/reports/" + reportAId + "/access-logs").header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicBToken))
                .andExpect(status().isForbidden());

        // Family B cannot read or update Family A's parent, book for Family A's parent, or read Family A's visit/report
        mockMvc.perform(get("/api/v1/parents").header(HttpHeaders.AUTHORIZATION, "Bearer " + famBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/v1/parents/" + parentAId).header(HttpHeaders.AUTHORIZATION, "Bearer " + famBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/visits")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + famBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "parentId", parentAId.toString(),
                                "clinicId", clinicAId.toString(),
                                "serviceType", "FOLLOW_UP_VISIT",
                                "scheduledDate", LocalDate.now().toString(),
                                "preferredTime", "10:00 AM"
                        ))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/visits/" + visitAId).header(HttpHeaders.AUTHORIZATION, "Bearer " + famBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/visits/" + visitAId + "/report").header(HttpHeaders.AUTHORIZATION, "Bearer " + famBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/parents/" + parentAId + "/reports").header(HttpHeaders.AUTHORIZATION, "Bearer " + famBToken))
                .andExpect(status().isForbidden());

        // ================= DIRECT SERVICE-LAYER ISOLATION PROOFS =================
        // Proves isolation holds inside the service layer even if controllers are bypassed
        AuthPrincipal clinicBPrincipal = new AuthPrincipal(clinicBAdminUserId, "clinicB@closeby.in", "Admin B", UserRole.CLINIC_ADMIN, clinicBId);
        AuthPrincipal familyBPrincipal = new AuthPrincipal(famBUserId, "ananya@closeby.in", "Ananya Joshi", UserRole.FAMILY, null);

        assertThatThrownBy(() -> staffService.getOwnClinicStaff(clinicBPrincipal, staffAId))
                .isInstanceOf(CloseByException.class)
                .extracting(e -> ((CloseByException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> visitService.getVisit(clinicBPrincipal, visitAId))
                .isInstanceOf(CloseByException.class)
                .extracting(e -> ((CloseByException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> reportService.getReportForVisit(clinicBPrincipal, visitAId))
                .isInstanceOf(CloseByException.class)
                .extracting(e -> ((CloseByException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> accessLogService.getLogsForReport(clinicBPrincipal, reportAId))
                .isInstanceOf(CloseByException.class)
                .extracting(e -> ((CloseByException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> parentService.getOwnParent(familyBPrincipal, parentAId))
                .isInstanceOf(CloseByException.class)
                .extracting(e -> ((CloseByException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> reportService.listParentReports(familyBPrincipal, parentAId))
                .isInstanceOf(CloseByException.class)
                .extracting(e -> ((CloseByException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        // Unauthorized report read attempts must NOT have written any access log entries
        assertThat(accessLogRepository.countByReportId(reportAId)).isZero();
    }
}
