package com.closeby;

import com.closeby.audit.ReportAccessLogRepository;
import com.closeby.auth.User;
import com.closeby.auth.UserRepository;
import com.closeby.auth.UserRole;
import com.closeby.clinic.ClinicRepository;
import com.closeby.parent.ParentRepository;
import com.closeby.report.VisitReportRepository;
import com.closeby.staff.ClinicStaffProfileRepository;
import com.closeby.visit.VisitRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected PasswordEncoder passwordEncoder;

    @Autowired protected ReportAccessLogRepository accessLogRepository;
    @Autowired protected VisitReportRepository reportRepository;
    @Autowired protected VisitRepository visitRepository;
    @Autowired protected ParentRepository parentRepository;
    @Autowired protected ClinicStaffProfileRepository staffProfileRepository;
    @Autowired protected UserRepository userRepository;
    @Autowired protected ClinicRepository clinicRepository;

    @BeforeEach
    void cleanDatabase() {
        accessLogRepository.deleteAll();
        reportRepository.deleteAll();
        visitRepository.deleteAll();
        parentRepository.deleteAll();
        staffProfileRepository.deleteAll();
        // Clear reviewed_by FK before deleting users/clinics
        clinicRepository.findAll().forEach(c -> {
            if (c.getReviewedBy() != null) {
                c.applyReviewStatus(c.getStatus(), c.getStatusReason(), null, c.getReviewedAt());
                clinicRepository.save(c);
            }
        });
        userRepository.deleteAll();
        clinicRepository.deleteAll();
    }

    protected User createPlatformAdmin(String email, String password) {
        return userRepository.save(new User(
                UUID.randomUUID(),
                "Platform Admin",
                email,
                "+91-755-2400001",
                passwordEncoder.encode(password),
                UserRole.PLATFORM_ADMIN,
                null,
                Instant.now()
        ));
    }

    protected String loginAndGetToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }

    protected JsonNode registerFamily(String name, String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/family")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", name,
                                "email", email,
                                "phone", "+91-98450-10001",
                                "password", password
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    protected JsonNode registerClinic(String adminName, String email, String clinicName, String regNo) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/clinic")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "adminFullName", adminName,
                                "email", email,
                                "adminPhone", "+91-98260-10001",
                                "password", "StrongPass@123",
                                "clinicName", clinicName,
                                "registrationNumber", regNo,
                                "locality", "Arera Colony",
                                "address", "Plot 10, Arera Colony, Bhopal",
                                "clinicPhone", "+91-755-2460001"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
