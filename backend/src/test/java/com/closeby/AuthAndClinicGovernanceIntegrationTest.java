package com.closeby;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthAndClinicGovernanceIntegrationTest extends BaseIntegrationTest {

    @Test
    void clinicRegistrationStartsPending_platformAdminApproves_andClinicCreatesVerifiedStaff() throws Exception {
        createPlatformAdmin("admin@closeby.in", "AdminPass@123");
        String adminToken = loginAndGetToken("admin@closeby.in", "AdminPass@123");

        JsonNode clinicReg = registerClinic(
                "Nikhil Verma",
                "lakeview@closeby.in",
                "Lakeview Homecare Clinic",
                "BPL-TEST-101"
        );
        String clinicToken = clinicReg.get("accessToken").asText();
        String clinicId = clinicReg.get("user").get("clinicId").asText();

        // Pending clinic cannot add staff yet
        mockMvc.perform(post("/api/v1/clinic/staff")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nurse Sunita Verma",
                                "email", "sunita@closeby.in",
                                "phone", "+91-98261-10001",
                                "password", "StaffPass@123",
                                "designation", "Registered Nurse"
                        ))))
                .andExpect(status().isForbidden());

        // Non-admin (Clinic Admin) cannot approve clinics
        mockMvc.perform(patch("/api/v1/admin/clinics/" + clinicId + "/approve")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken))
                .andExpect(status().isForbidden());

        // Platform Admin approves clinic
        mockMvc.perform(patch("/api/v1/admin/clinics/" + clinicId + "/approve")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        // Approved clinic can now add verified staff with "Verified by <Clinic>" badge
        mockMvc.perform(post("/api/v1/clinic/staff")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + clinicToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nurse Sunita Verma",
                                "email", "sunita@closeby.in",
                                "phone", "+91-98261-10001",
                                "password", "StaffPass@123",
                                "designation", "Registered Nurse"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verifiedByClinic", is(true)))
                .andExpect(jsonPath("$.verifiedBadge", is("Verified by Lakeview Homecare Clinic")));

        // Staff user can log in and inspect /auth/me
        String staffToken = loginAndGetToken("sunita@closeby.in", "StaffPass@123");
        mockMvc.perform(get("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("CLINIC_STAFF")))
                .andExpect(jsonPath("$.clinicId", is(clinicId)));

        // Platform Admin can suspend clinic
        mockMvc.perform(patch("/api/v1/admin/clinics/" + clinicId + "/suspend")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Renewal check"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SUSPENDED")));
    }

    @Test
    void openApiDocsArePubliclyAccessible() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title", is("closeBy REST API")));
    }
}
