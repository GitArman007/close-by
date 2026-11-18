package com.closeby.seed;

import com.closeby.audit.ReportAccessLog;
import com.closeby.audit.ReportAccessLogRepository;
import com.closeby.auth.User;
import com.closeby.auth.UserRepository;
import com.closeby.auth.UserRole;
import com.closeby.clinic.Clinic;
import com.closeby.clinic.ClinicRepository;
import com.closeby.clinic.ClinicStatus;
import com.closeby.parent.Parent;
import com.closeby.parent.ParentRepository;
import com.closeby.report.BloodSugarContext;
import com.closeby.report.RecommendationType;
import com.closeby.report.VisitReport;
import com.closeby.report.VisitReportRepository;
import com.closeby.staff.ClinicStaffProfile;
import com.closeby.staff.ClinicStaffProfileRepository;
import com.closeby.visit.ServiceType;
import com.closeby.visit.Visit;
import com.closeby.visit.VisitRepository;
import com.closeby.visit.VisitStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Idempotent realistic Bhopal demo dataset:
 * - 5 fictional Bhopal clinics (3 APPROVED, 1 PENDING, 1 SUSPENDED)
 * - 6 verified clinic staff members across approved clinics
 * - 6 family accounts managing 12 parents with plausible Indian names & consent timestamps
 * - 40 visits across the last 60 days spanning all 5 statuses & all 4 services with realistic readings
 */
@Component
public class BhopalDemoDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(BhopalDemoDataSeeder.class);
    public static final String DEMO_PASSWORD = "Demo@1234";

    private final boolean seedEnabled;
    private final UserRepository userRepository;
    private final ClinicRepository clinicRepository;
    private final ClinicStaffProfileRepository staffProfileRepository;
    private final ParentRepository parentRepository;
    private final VisitRepository visitRepository;
    private final VisitReportRepository reportRepository;
    private final ReportAccessLogRepository accessLogRepository;
    private final PasswordEncoder passwordEncoder;

    public BhopalDemoDataSeeder(
            @Value("${closeby.seed.enabled:false}") boolean seedEnabled,
            UserRepository userRepository,
            ClinicRepository clinicRepository,
            ClinicStaffProfileRepository staffProfileRepository,
            ParentRepository parentRepository,
            VisitRepository visitRepository,
            VisitReportRepository reportRepository,
            ReportAccessLogRepository accessLogRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.seedEnabled = seedEnabled;
        this.userRepository = userRepository;
        this.clinicRepository = clinicRepository;
        this.staffProfileRepository = staffProfileRepository;
        this.parentRepository = parentRepository;
        this.visitRepository = visitRepository;
        this.reportRepository = reportRepository;
        this.accessLogRepository = accessLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (seedEnabled) {
            seedIfEmpty();
        }
    }

    @Transactional
    public void seedIfEmpty() {
        if (userRepository.existsByEmailIgnoreCase("admin@closeby.in")) {
            log.info("closeBy demo seed already present; skipping.");
            return;
        }

        Instant now = Instant.now();
        String passwordHash = passwordEncoder.encode(DEMO_PASSWORD);

        // 1. Platform Admin
        User platformAdmin = new User(
                UUID.randomUUID(),
                "Dr. Aarav Kulkarni (Platform Admin)",
                "admin@closeby.in",
                "+91-755-2401001",
                passwordHash,
                UserRole.PLATFORM_ADMIN,
                null,
                now.minus(90, ChronoUnit.DAYS)
        );
        userRepository.save(platformAdmin);

        // 2. Five 100% fictional Bhopal clinics
        Clinic lakeview = createClinic(
                "Lakeview Homecare Clinic",
                "BPL-FICT-001",
                "Arera Colony",
                "E-4/45, Arera Colony, Bhopal, MP 462016",
                "+91-755-2461101",
                ClinicStatus.APPROVED,
                null,
                platformAdmin.getId(),
                now.minus(75, ChronoUnit.DAYS)
        );
        Clinic badaTalab = createClinic(
                "Bada Talab Care Collective",
                "BPL-FICT-002",
                "MP Nagar",
                "Plot 18, Zone-II, MP Nagar, Bhopal, MP 462011",
                "+91-755-2552202",
                ClinicStatus.APPROVED,
                null,
                platformAdmin.getId(),
                now.minus(70, ChronoUnit.DAYS)
        );
        Clinic vindhyaHearth = createClinic(
                "Vindhya Hearth Health Center",
                "BPL-FICT-003",
                "Shahpura",
                "B-24, Sector B, Shahpura, Bhopal, MP 462039",
                "+91-755-2423303",
                ClinicStatus.APPROVED,
                null,
                platformAdmin.getId(),
                now.minus(65, ChronoUnit.DAYS)
        );
        Clinic kolarCanopy = createClinic(
                "Kolar Canopy Family Care",
                "BPL-FICT-004",
                "Kolar Road",
                "12, Near Bima Kunj, Kolar Road, Bhopal, MP 462042",
                "+91-755-2494404",
                ClinicStatus.PENDING,
                null,
                null,
                now.minus(3, ChronoUnit.DAYS)
        );
        Clinic upperLake = createClinic(
                "Upper Lake Wellness Desk",
                "BPL-FICT-005",
                "TT Nagar",
                "Shop 7, South TT Nagar, Bhopal, MP 462003",
                "+91-755-2575505",
                ClinicStatus.SUSPENDED,
                "Awaiting updated clinic registration renewal certificate.",
                platformAdmin.getId(),
                now.minus(50, ChronoUnit.DAYS)
        );

        List<Clinic> approvedClinics = List.of(lakeview, badaTalab, vindhyaHearth);

        // 3. Clinic Admins (1 per clinic)
        User lakeviewAdmin = createUser("Nikhil Srivastava", "clinic.lakeview@closeby.in", "+91-98260-11001", passwordHash, UserRole.CLINIC_ADMIN, lakeview.getId(), now.minus(75, ChronoUnit.DAYS));
        User badaTalabAdmin = createUser("Meenakshi Dubey", "clinic.badatalab@closeby.in", "+91-98260-11002", passwordHash, UserRole.CLINIC_ADMIN, badaTalab.getId(), now.minus(70, ChronoUnit.DAYS));
        User vindhyaAdmin = createUser("Raghavendra Patel", "clinic.vindhya@closeby.in", "+91-98260-11003", passwordHash, UserRole.CLINIC_ADMIN, vindhyaHearth.getId(), now.minus(65, ChronoUnit.DAYS));
        createUser("Sandeep Bhargava", "clinic.kolar@closeby.in", "+91-98260-11004", passwordHash, UserRole.CLINIC_ADMIN, kolarCanopy.getId(), now.minus(3, ChronoUnit.DAYS));
        createUser("Farhan Qureshi", "clinic.upperlake@closeby.in", "+91-98260-11005", passwordHash, UserRole.CLINIC_ADMIN, upperLake.getId(), now.minus(50, ChronoUnit.DAYS));

        List<User> approvedAdmins = List.of(lakeviewAdmin, badaTalabAdmin, vindhyaAdmin);

        // 4. Verified Clinic Staff (2 per approved clinic = 6 staff)
        User staffSunita = createStaff("Nurse Sunita Verma", "staff.sunita@closeby.in", "+91-98261-21001", "Registered Nurse", lakeview.getId(), passwordHash, now.minus(72, ChronoUnit.DAYS));
        User staffRajesh = createStaff("Rajesh Patidar", "staff.rajesh@closeby.in", "+91-98261-21002", "Lab Technician", lakeview.getId(), passwordHash, now.minus(71, ChronoUnit.DAYS));
        User staffKavita = createStaff("Nurse Kavita Dubey", "staff.kavita@closeby.in", "+91-98261-21003", "Registered Nurse", badaTalab.getId(), passwordHash, now.minus(68, ChronoUnit.DAYS));
        User staffAmit = createStaff("Amit Tiwari", "staff.amit@closeby.in", "+91-98261-21004", "Health Assistant", badaTalab.getId(), passwordHash, now.minus(67, ChronoUnit.DAYS));
        User staffPreeti = createStaff("Nurse Preeti Malviya", "staff.preeti@closeby.in", "+91-98261-21005", "Registered Nurse", vindhyaHearth.getId(), passwordHash, now.minus(63, ChronoUnit.DAYS));
        User staffDeepak = createStaff("Deepak Kushwaha", "staff.deepak@closeby.in", "+91-98261-21006", "Phlebotomist", vindhyaHearth.getId(), passwordHash, now.minus(62, ChronoUnit.DAYS));

        List<List<User>> clinicStaffMap = List.of(
                List.of(staffSunita, staffRajesh),
                List.of(staffKavita, staffAmit),
                List.of(staffPreeti, staffDeepak)
        );

        // 5. Six family users managing 12 Bhopal parents (plausible Indian names & ages 62-81)
        User famRohan = createUser("Rohan Sharma", "family.rohan@closeby.in", "+91-98450-31001", passwordHash, UserRole.FAMILY, null, now.minus(62, ChronoUnit.DAYS));
        User famAnanya = createUser("Ananya Joshi", "family.ananya@closeby.in", "+91-98220-31002", passwordHash, UserRole.FAMILY, null, now.minus(60, ChronoUnit.DAYS));
        User famVikram = createUser("Vikram Saxena", "family.vikram@closeby.in", "+91-98200-31003", passwordHash, UserRole.FAMILY, null, now.minus(58, ChronoUnit.DAYS));
        User famNeha = createUser("Neha Deshmukh", "family.neha@closeby.in", "+91-98490-31004", passwordHash, UserRole.FAMILY, null, now.minus(55, ChronoUnit.DAYS));
        User famSiddharth = createUser("Siddharth Tiwari", "family.siddharth@closeby.in", "+91-98110-31005", passwordHash, UserRole.FAMILY, null, now.minus(52, ChronoUnit.DAYS));
        User famPriya = createUser("Priya Chaturvedi", "family.priya@closeby.in", "+91-98100-31006", passwordHash, UserRole.FAMILY, null, now.minus(48, ChronoUnit.DAYS));

        List<Parent> parents = new ArrayList<>();
        parents.add(createParent(famRohan.getId(), "Smt. Meera Sharma", 68, "Female", "+91-755-2463101", "Arera Colony", "E-4/72, Arera Colony, Bhopal", "Prefers morning visits before 10:30 AM. Gate bell on left pillar.", now.minus(61, ChronoUnit.DAYS)));
        parents.add(createParent(famRohan.getId(), "Shri Ramesh Sharma", 71, "Male", "+91-755-2463101", "Arera Colony", "E-4/72, Arera Colony, Bhopal", "Takes morning BP medication at 8:00 AM.", now.minus(61, ChronoUnit.DAYS)));
        parents.add(createParent(famAnanya.getId(), "Shri Arvind Joshi", 73, "Male", "+91-755-2573102", "TT Nagar", "14/B, North TT Nagar, Bhopal", "Ground floor flat; prefers calm unhurried conversation.", now.minus(59, ChronoUnit.DAYS)));
        parents.add(createParent(famAnanya.getId(), "Smt. Savita Joshi", 69, "Female", "+91-755-2573102", "TT Nagar", "14/B, North TT Nagar, Bhopal", "Please ring twice; uses knee brace when walking.", now.minus(59, ChronoUnit.DAYS)));
        parents.add(createParent(famVikram.getId(), "Smt. Rekha Saxena", 66, "Female", "+91-755-2423103", "Shahpura", "C-19, Sector B, Shahpura, Bhopal", "Keep fasting blood sugar check before 9:00 AM.", now.minus(57, ChronoUnit.DAYS)));
        parents.add(createParent(famVikram.getId(), "Shri Prakash Saxena", 70, "Male", "+91-755-2423103", "Shahpura", "C-19, Sector B, Shahpura, Bhopal", "Walks in park until 8:15 AM.", now.minus(57, ChronoUnit.DAYS)));
        parents.add(createParent(famNeha.getId(), "Smt. Usha Deshmukh", 75, "Female", "+91-755-2723104", "Gulmohar Colony", "G-104, Gulmohar Colony, Bhopal", "Caretaker Rekha bai opens the door.", now.minus(54, ChronoUnit.DAYS)));
        parents.add(createParent(famNeha.getId(), "Shri Mohan Deshmukh", 79, "Male", "+91-755-2723104", "Gulmohar Colony", "G-104, Gulmohar Colony, Bhopal", "Uses hearing aid on right ear.", now.minus(54, ChronoUnit.DAYS)));
        parents.add(createParent(famSiddharth.getId(), "Shri Harish Tiwari", 64, "Male", "+91-755-2483105", "Saket Nagar", "2-B/19, Saket Nagar, Bhopal", "Morning tea after 9:00 AM.", now.minus(51, ChronoUnit.DAYS)));
        parents.add(createParent(famSiddharth.getId(), "Smt. Kamla Tiwari", 62, "Female", "+91-755-2483105", "Saket Nagar", "2-B/19, Saket Nagar, Bhopal", "Prefer female nursing staff when available.", now.minus(51, ChronoUnit.DAYS)));
        parents.add(createParent(famPriya.getId(), "Smt. Shanti Chaturvedi", 77, "Female", "+91-755-2493106", "Chunabhatti", "Plot 42, Chunabhatti, Bhopal", "Please call landline 10 minutes before arrival.", now.minus(47, ChronoUnit.DAYS)));
        parents.add(createParent(famPriya.getId(), "Shri Kailash Chaturvedi", 81, "Male", "+91-755-2493107", "Bawadiya Kalan", "A-11, Rohit Nagar Phase 1, Bawadiya Kalan, Bhopal", "Rests between 2:00 PM and 4:00 PM.", now.minus(47, ChronoUnit.DAYS)));

        // 6. Forty visits over the last 60 days across all 5 statuses and all 4 services
        //    26 COMPLETED + 4 IN_PROGRESS + 4 ASSIGNED + 3 REQUESTED + 3 CANCELLED = 40 visits
        ServiceType[] services = ServiceType.values();
        String[] timeSlots = {
                "08:00 AM - 09:30 AM",
                "09:30 AM - 11:00 AM",
                "11:00 AM - 12:30 PM",
                "04:30 PM - 06:00 PM"
        };
        String[] observationNotesPool = {
                "Parent was alert and comfortable throughout the visit. Morning medicines were taken on schedule and pill box was checked.",
                "Routine home readings taken after 5 minutes of seated rest. Hydration and appetite reported steady by family caretaker.",
                "Sample collected smoothly with minimal discomfort. Parent rested comfortably afterwards and confirmed regular evening walks.",
                "Medication organizer reviewed for the next four days; all morning and evening doses accounted for accurately.",
                "Parent reported mild fatigue after yesterday's travel; seated blood pressure and blood sugar readings logged clearly.",
                "Calm morning visit. Parent shared recent sleep pattern and confirmed regular intake of prescribed routine tablets."
        };

        LocalDate today = LocalDate.now();

        // 26 COMPLETED visits (indices 0..25) — first 6 are Smt. Meera Sharma for rich sparkline trend
        int[] completedDaysAgo = {
                57, 48, 39, 28, 17, 6,  // Smt. Meera Sharma (6 readings over 60 days)
                55, 51, 46, 42, 38, 35, 31, 29, 25, 22, 19, 16, 14, 12, 10, 8, 5, 4, 3, 2
        };
        int[] bpSysPool = {
                136, 134, 130, 128, 126, 128,
                142, 122, 138, 118, 132, 146, 124, 130, 126, 140, 120, 134, 128, 136, 124, 132, 129, 138, 122, 126
        };
        int[] bpDiaPool = {
                86, 84, 82, 82, 80, 82,
                88, 78, 86, 76, 84, 92, 78, 82, 80, 88, 74, 84, 80, 86, 78, 82, 80, 86, 76, 80
        };
        int[] sugarPool = {
                122, 116, 112, 108, 106, 104,
                156, 98, 142, 102, 128, 164, 96, 118, 110, 148, 94, 124, 114, 136, 100, 120, 108, 152, 99, 112
        };
        BigDecimal[] tempPool = {
                new BigDecimal("98.4"), new BigDecimal("98.2"), new BigDecimal("98.6"),
                new BigDecimal("98.3"), new BigDecimal("98.5"), new BigDecimal("98.4")
        };
        BloodSugarContext[] sugarCtxPool = {
                BloodSugarContext.FASTING, BloodSugarContext.POST_MEAL, BloodSugarContext.RANDOM
        };

        for (int i = 0; i < 26; i++) {
            Parent parent = i < 6 ? parents.get(0) : parents.get(1 + ((i - 6) % (parents.size() - 1)));
            int clinicIdx = i < 6 ? 0 : (i % approvedClinics.size());
            Clinic clinic = approvedClinics.get(clinicIdx);
            List<User> clinicStaff = clinicStaffMap.get(clinicIdx);
            User staff = clinicStaff.get(i % clinicStaff.size());
            User clinicAdmin = approvedAdmins.get(clinicIdx);

            int daysAgo = completedDaysAgo[i];
            Instant createdAt = now.minus(daysAgo, ChronoUnit.DAYS).minus(4, ChronoUnit.HOURS);
            Instant assignedAt = createdAt.plus(20 + (i % 45), ChronoUnit.MINUTES);
            Instant startedAt = assignedAt.plus(90, ChronoUnit.MINUTES);
            Instant completedAt = startedAt.plus(25, ChronoUnit.MINUTES);

            Visit visit = new Visit(
                    UUID.randomUUID(),
                    parent.getFamilyUserId(),
                    parent.getId(),
                    clinic.getId(),
                    services[i % services.length],
                    today.minusDays(daysAgo),
                    timeSlots[i % timeSlots.length],
                    parent.getAddress(),
                    "Please share readings clearly on completion.",
                    createdAt
            );
            visit.assignStaff(staff.getId(), assignedAt);
            visit.start(startedAt);
            visit.complete(completedAt);
            visitRepository.save(visit);

            RecommendationType rec = (bpSysPool[i] >= 142 || sugarPool[i] >= 160)
                    ? RecommendationType.DOCTOR_CONSULT
                    : (i % 5 == 0 ? RecommendationType.FOLLOW_UP_VISIT : RecommendationType.NONE);

            VisitReport report = new VisitReport(
                    UUID.randomUUID(),
                    visit.getId(),
                    clinic.getId(),
                    staff.getId(),
                    bpSysPool[i],
                    bpDiaPool[i],
                    tempPool[i % tempPool.length],
                    sugarPool[i],
                    i < 6 ? BloodSugarContext.FASTING : sugarCtxPool[i % sugarCtxPool.length],
                    observationNotesPool[i % observationNotesPool.length],
                    rec,
                    completedAt
            );
            reportRepository.save(report);

            // Seed realistic report access log entries
            accessLogRepository.save(new ReportAccessLog(
                    UUID.randomUUID(),
                    report.getId(),
                    visit.getId(),
                    clinic.getId(),
                    parent.getFamilyUserId(),
                    UserRole.FAMILY,
                    completedAt.plus(18, ChronoUnit.MINUTES)
            ));
            if (i % 2 == 0) {
                accessLogRepository.save(new ReportAccessLog(
                        UUID.randomUUID(),
                        report.getId(),
                        visit.getId(),
                        clinic.getId(),
                        clinicAdmin.getId(),
                        UserRole.CLINIC_ADMIN,
                        completedAt.plus(45, ChronoUnit.MINUTES)
                ));
            }
        }

        // 4 IN_PROGRESS visits (today)
        for (int i = 0; i < 4; i++) {
            Parent parent = parents.get((i * 2 + 2) % parents.size());
            int clinicIdx = i % approvedClinics.size();
            Clinic clinic = approvedClinics.get(clinicIdx);
            User staff = clinicStaffMap.get(clinicIdx).get(0);

            Instant createdAt = now.minus(3 + i, ChronoUnit.HOURS);
            Instant assignedAt = createdAt.plus(22 + i * 5L, ChronoUnit.MINUTES);
            Instant startedAt = now.minus(15 + i * 4L, ChronoUnit.MINUTES);

            Visit visit = new Visit(
                    UUID.randomUUID(),
                    parent.getFamilyUserId(),
                    parent.getId(),
                    clinic.getId(),
                    services[i % services.length],
                    today,
                    timeSlots[i % timeSlots.length],
                    parent.getAddress(),
                    "Call landline before ringing the bell.",
                    createdAt
            );
            visit.assignStaff(staff.getId(), assignedAt);
            visit.start(startedAt);
            visitRepository.save(visit);
        }

        // 4 ASSIGNED visits (today / tomorrow)
        for (int i = 0; i < 4; i++) {
            Parent parent = parents.get((i * 3 + 1) % parents.size());
            int clinicIdx = i % approvedClinics.size();
            Clinic clinic = approvedClinics.get(clinicIdx);
            User staff = clinicStaffMap.get(clinicIdx).get(i % 2);

            Instant createdAt = now.minus(5 + i * 2L, ChronoUnit.HOURS);
            Instant assignedAt = createdAt.plus(30 + i * 6L, ChronoUnit.MINUTES);

            Visit visit = new Visit(
                    UUID.randomUUID(),
                    parent.getFamilyUserId(),
                    parent.getId(),
                    clinic.getId(),
                    services[(i + 1) % services.length],
                    today.plusDays(i == 0 ? 0 : 1),
                    timeSlots[(i + 1) % timeSlots.length],
                    parent.getAddress(),
                    "Morning check before breakfast.",
                    createdAt
            );
            visit.assignStaff(staff.getId(), assignedAt);
            visitRepository.save(visit);
        }

        // 3 REQUESTED visits (awaiting clinic staff assignment)
        for (int i = 0; i < 3; i++) {
            Parent parent = parents.get(i == 0 ? 0 : (i * 4 + 3) % parents.size());
            Clinic clinic = approvedClinics.get(i % approvedClinics.size());

            Visit visit = new Visit(
                    UUID.randomUUID(),
                    parent.getFamilyUserId(),
                    parent.getId(),
                    clinic.getId(),
                    services[(i + 2) % services.length],
                    today.plusDays(1 + i),
                    timeSlots[i % timeSlots.length],
                    parent.getAddress(),
                    "Routine check-in requested remotely by family.",
                    now.minus(40 + i * 25L, ChronoUnit.MINUTES)
            );
            visitRepository.save(visit);
        }

        // 3 CANCELLED visits (over last 30 days)
        String[] cancelReasons = {
                "Parent travelled to visit family in Indore for the weekend.",
                "Rescheduled to the following morning for fasting blood sugar.",
                "Family requested an afternoon slot instead."
        };
        int[] cancelledDaysAgo = {24, 15, 7};
        for (int i = 0; i < 3; i++) {
            Parent parent = parents.get((i * 3 + 5) % parents.size());
            Clinic clinic = approvedClinics.get(i % approvedClinics.size());

            Instant createdAt = now.minus(cancelledDaysAgo[i], ChronoUnit.DAYS);
            Visit visit = new Visit(
                    UUID.randomUUID(),
                    parent.getFamilyUserId(),
                    parent.getId(),
                    clinic.getId(),
                    services[i % services.length],
                    today.minusDays(cancelledDaysAgo[i]),
                    timeSlots[i % timeSlots.length],
                    parent.getAddress(),
                    null,
                    createdAt
            );
            visit.cancel(cancelReasons[i], createdAt.plus(2, ChronoUnit.HOURS));
            visitRepository.save(visit);
        }

        log.info("closeBy demo data seeded: 5 fictional Bhopal clinics, 12 parents, 40 visits across 60 days.");
    }

    private Clinic createClinic(
            String name,
            String regNo,
            String locality,
            String address,
            String phone,
            ClinicStatus status,
            String statusReason,
            UUID reviewedBy,
            Instant createdAt
    ) {
        Clinic clinic = new Clinic(UUID.randomUUID(), name, regNo, locality, address, phone, createdAt);
        if (status != ClinicStatus.PENDING) {
            clinic.applyReviewStatus(status, statusReason, reviewedBy, createdAt.plus(6, ChronoUnit.HOURS));
        }
        return clinicRepository.save(clinic);
    }

    private User createUser(
            String fullName,
            String email,
            String phone,
            String passwordHash,
            UserRole role,
            UUID clinicId,
            Instant createdAt
    ) {
        return userRepository.save(new User(
                UUID.randomUUID(),
                fullName,
                email,
                phone,
                passwordHash,
                role,
                clinicId,
                createdAt
        ));
    }

    private User createStaff(
            String fullName,
            String email,
            String phone,
            String designation,
            UUID clinicId,
            String passwordHash,
            Instant createdAt
    ) {
        User staffUser = createUser(fullName, email, phone, passwordHash, UserRole.CLINIC_STAFF, clinicId, createdAt);
        staffProfileRepository.save(new ClinicStaffProfile(
                UUID.randomUUID(),
                staffUser.getId(),
                clinicId,
                designation,
                createdAt
        ));
        return staffUser;
    }

    private Parent createParent(
            UUID familyUserId,
            String fullName,
            int age,
            String gender,
            String phone,
            String locality,
            String address,
            String notes,
            Instant createdAt
    ) {
        return parentRepository.save(new Parent(
                UUID.randomUUID(),
                familyUserId,
                fullName,
                age,
                gender,
                phone,
                locality,
                address,
                notes,
                createdAt,
                createdAt
        ));
    }
}
