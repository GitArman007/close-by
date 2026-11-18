package com.closeby.visit;

import com.closeby.common.CloseByException;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "visits")
public class Visit {

    @Id
    private UUID id;

    @Column(name = "family_user_id", nullable = false)
    private UUID familyUserId;

    @Column(name = "parent_id", nullable = false)
    private UUID parentId;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "assigned_staff_id")
    private UUID assignedStaffId;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 40)
    private ServiceType serviceType;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "preferred_time", nullable = false, length = 40)
    private String preferredTime;

    @Column(name = "visit_address", nullable = false, columnDefinition = "TEXT")
    private String visitAddress;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VisitStatus status = VisitStatus.REQUESTED;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Visit() {}

    public Visit(
            UUID id,
            UUID familyUserId,
            UUID parentId,
            UUID clinicId,
            ServiceType serviceType,
            LocalDate scheduledDate,
            String preferredTime,
            String visitAddress,
            String instructions,
            Instant now
    ) {
        this.id = id;
        this.familyUserId = familyUserId;
        this.parentId = parentId;
        this.clinicId = clinicId;
        this.serviceType = serviceType;
        this.scheduledDate = scheduledDate;
        this.preferredTime = preferredTime;
        this.visitAddress = visitAddress;
        this.instructions = instructions;
        this.status = VisitStatus.REQUESTED;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() {
        return id;
    }

    public UUID getFamilyUserId() {
        return familyUserId;
    }

    public UUID getParentId() {
        return parentId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public UUID getAssignedStaffId() {
        return assignedStaffId;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public String getPreferredTime() {
        return preferredTime;
    }

    public String getVisitAddress() {
        return visitAddress;
    }

    public String getInstructions() {
        return instructions;
    }

    public VisitStatus getStatus() {
        return status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void assignStaff(UUID staffUserId, Instant when) {
        assertCanTransitionTo(VisitStatus.ASSIGNED);
        this.assignedStaffId = staffUserId;
        this.assignedAt = when;
        this.status = VisitStatus.ASSIGNED;
        this.updatedAt = when;
    }

    public void start(Instant when) {
        assertCanTransitionTo(VisitStatus.IN_PROGRESS);
        this.status = VisitStatus.IN_PROGRESS;
        this.startedAt = when;
        this.updatedAt = when;
    }

    public void complete(Instant when) {
        assertCanTransitionTo(VisitStatus.COMPLETED);
        this.status = VisitStatus.COMPLETED;
        this.completedAt = when;
        this.updatedAt = when;
    }

    public void cancel(String reason, Instant when) {
        assertCanTransitionTo(VisitStatus.CANCELLED);
        this.status = VisitStatus.CANCELLED;
        this.cancellationReason = reason;
        this.updatedAt = when;
    }

    private void assertCanTransitionTo(VisitStatus next) {
        if (!this.status.canTransitionTo(next)) {
            throw CloseByException.conflict(
                    "Illegal visit status transition from " + this.status + " to " + next + "."
            );
        }
    }
}
