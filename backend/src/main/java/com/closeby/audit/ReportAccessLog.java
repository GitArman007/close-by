package com.closeby.audit;

import com.closeby.auth.UserRole;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "report_access_logs")
public class ReportAccessLog {

    @Id
    private UUID id;

    @Column(name = "report_id", nullable = false)
    private UUID reportId;

    @Column(name = "visit_id", nullable = false)
    private UUID visitId;

    @Column(name = "clinic_id", nullable = false)
    private UUID clinicId;

    @Column(name = "viewer_user_id", nullable = false)
    private UUID viewerUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "viewer_role", nullable = false, length = 30)
    private UserRole viewerRole;

    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt;

    protected ReportAccessLog() {}

    public ReportAccessLog(
            UUID id,
            UUID reportId,
            UUID visitId,
            UUID clinicId,
            UUID viewerUserId,
            UserRole viewerRole,
            Instant viewedAt
    ) {
        this.id = id;
        this.reportId = reportId;
        this.visitId = visitId;
        this.clinicId = clinicId;
        this.viewerUserId = viewerUserId;
        this.viewerRole = viewerRole;
        this.viewedAt = viewedAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getReportId() {
        return reportId;
    }

    public UUID getVisitId() {
        return visitId;
    }

    public UUID getClinicId() {
        return clinicId;
    }

    public UUID getViewerUserId() {
        return viewerUserId;
    }

    public UserRole getViewerRole() {
        return viewerRole;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }
}
