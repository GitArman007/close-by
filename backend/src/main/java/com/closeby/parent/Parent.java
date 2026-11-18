package com.closeby.parent;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parents")
public class Parent {

    @Id
    private UUID id;

    @Column(name = "family_user_id", nullable = false)
    private UUID familyUserId;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false)
    private int age;

    @Column(nullable = false, length = 20)
    private String gender;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String locality;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "consent_confirmed", nullable = false)
    private boolean consentConfirmed;

    @Column(name = "consent_confirmed_at", nullable = false)
    private Instant consentConfirmedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Parent() {}

    public Parent(
            UUID id,
            UUID familyUserId,
            String fullName,
            int age,
            String gender,
            String phone,
            String locality,
            String address,
            String notes,
            Instant consentConfirmedAt,
            Instant now
    ) {
        this.id = id;
        this.familyUserId = familyUserId;
        this.fullName = fullName;
        this.age = age;
        this.gender = gender;
        this.phone = phone;
        this.locality = locality;
        this.address = address;
        this.notes = notes;
        this.consentConfirmed = true;
        this.consentConfirmedAt = consentConfirmedAt;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public UUID getFamilyUserId() {
        return familyUserId;
    }

    public String getFullName() {
        return fullName;
    }

    public int getAge() {
        return age;
    }

    public String getGender() {
        return gender;
    }

    public String getPhone() {
        return phone;
    }

    public String getLocality() {
        return locality;
    }

    public String getAddress() {
        return address;
    }

    public String getNotes() {
        return notes;
    }

    public boolean isConsentConfirmed() {
        return consentConfirmed;
    }

    public Instant getConsentConfirmedAt() {
        return consentConfirmedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateDetails(
            String fullName,
            int age,
            String gender,
            String phone,
            String locality,
            String address,
            String notes
    ) {
        this.fullName = fullName;
        this.age = age;
        this.gender = gender;
        this.phone = phone;
        this.locality = locality;
        this.address = address;
        this.notes = notes;
        this.updatedAt = Instant.now();
    }
}
