package com.closeby.clinic;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clinics")
public class Clinic {

    @Id
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "registration_number", nullable = false, unique = true, length = 80)
    private String registrationNumber;

    @Column(nullable = false, length = 100)
    private String locality;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false, length = 50)
    private String city = "Bhopal";

    @Column(nullable = false, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClinicStatus status = ClinicStatus.PENDING;

    @Column(name = "status_reason", columnDefinition = "TEXT")
    private String statusReason;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Clinic() {}

    public Clinic(
            UUID id,
            String name,
            String registrationNumber,
            String locality,
            String address,
            String phone,
            Instant now
    ) {
        this.id = id;
        this.name = name;
        this.registrationNumber = registrationNumber;
        this.locality = locality;
        this.address = address;
        this.city = "Bhopal";
        this.phone = phone;
        this.status = ClinicStatus.PENDING;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public String getLocality() {
        return locality;
    }

    public String getAddress() {
        return address;
    }

    public String getCity() {
        return city;
    }

    public String getPhone() {
        return phone;
    }

    public ClinicStatus getStatus() {
        return status;
    }

    public String getStatusReason() {
        return statusReason;
    }

    public UUID getReviewedBy() {
        return reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateProfile(String name, String locality, String address, String phone) {
        this.name = name;
        this.locality = locality;
        this.address = address;
        this.phone = phone;
        this.updatedAt = Instant.now();
    }

    public void applyReviewStatus(ClinicStatus newStatus, String reason, UUID reviewerId, Instant reviewedAt) {
        this.status = newStatus;
        this.statusReason = reason;
        this.reviewedBy = reviewerId;
        this.reviewedAt = reviewedAt;
        this.updatedAt = reviewedAt;
    }
}
