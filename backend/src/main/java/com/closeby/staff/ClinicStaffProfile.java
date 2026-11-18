package com.closeby.staff;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clinic_staff_profiles")
public class ClinicStaffProfile {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(nullable = false, length = 80)
    private String designation;

    @Column(name = "verified_by_clinic", nullable = false)
    private boolean verifiedByClinic = true;

    @Column(name = "verified_at", nullable = false)
    private Instant verifiedAt;

    @Column(nullable = false)
    private boolean active = true;

    protected ClinicStaffProfile() {}

    public ClinicStaffProfile(
            UUID id,
            UUID userId,
            UUID clinicId,
            String designation,
            Instant verifiedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.clinicId = clinicId;
        this.designation = designation;
        this.verifiedByClinic = true;
        this.verifiedAt = verifiedAt;
        this.active = true;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public String getDesignation() {
        return designation;
    }

    public boolean isVerifiedByClinic() {
        return verifiedByClinic;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
