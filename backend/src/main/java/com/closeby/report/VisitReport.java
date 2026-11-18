package com.closeby.report;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Observations-only home visit report.
 * Strictly non-diagnostic: never stores diagnoses, disease labels, or prescriptions.
 */
@Entity
@Table(name = "visit_reports")
public class VisitReport {

    @Id
    private UUID id;

    @Column(name = "visit_id", nullable = false, unique = true)
    private UUID visitId;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "recorded_by_staff_id", nullable = false)
    private UUID recordedByStaffId;

    @Column(name = "bp_systolic")
    private Integer bpSystolic;

    @Column(name = "bp_diastolic")
    private Integer bpDiastolic;

    @Column(name = "temperature_f", precision = 4, scale = 1)
    private BigDecimal temperatureF;

    @Column(name = "blood_sugar_mg_dl")
    private Integer bloodSugarMgDl;

    @Enumerated(EnumType.STRING)
    @Column(name = "blood_sugar_context", length = 30)
    private BloodSugarContext bloodSugarContext;

    @Column(name = "observation_notes", nullable = false, columnDefinition = "TEXT")
    private String observationNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RecommendationType recommendation = RecommendationType.NONE;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    protected VisitReport() {}

    public VisitReport(
            UUID id,
            UUID visitId,
            UUID clinicId,
            UUID recordedByStaffId,
            Integer bpSystolic,
            Integer bpDiastolic,
            BigDecimal temperatureF,
            Integer bloodSugarMgDl,
            BloodSugarContext bloodSugarContext,
            String observationNotes,
            RecommendationType recommendation,
            Instant recordedAt
    ) {
        this.id = id;
        this.visitId = visitId;
        this.clinicId = clinicId;
        this.recordedByStaffId = recordedByStaffId;
        this.bpSystolic = bpSystolic;
        this.bpDiastolic = bpDiastolic;
        this.temperatureF = temperatureF;
        this.bloodSugarMgDl = bloodSugarMgDl;
        this.bloodSugarContext = bloodSugarContext;
        this.observationNotes = observationNotes;
        this.recommendation = recommendation != null ? recommendation : RecommendationType.NONE;
        this.recordedAt = recordedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getVisitId() {
        return visitId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public UUID getRecordedByStaffId() {
        return recordedByStaffId;
    }

    public Integer getBpSystolic() {
        return bpSystolic;
    }

    public Integer getBpDiastolic() {
        return bpDiastolic;
    }

    public BigDecimal getTemperatureF() {
        return temperatureF;
    }

    public Integer getBloodSugarMgDl() {
        return bloodSugarMgDl;
    }

    public BloodSugarContext getBloodSugarContext() {
        return bloodSugarContext;
    }

    public String getObservationNotes() {
        return observationNotes;
    }

    public RecommendationType getRecommendation() {
        return recommendation;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }
}
