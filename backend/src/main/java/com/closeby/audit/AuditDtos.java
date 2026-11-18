package com.closeby.audit;

import com.closeby.auth.UserRole;

import java.time.Instant;
import java.util.UUID;

public final class AuditDtos {

    private AuditDtos() {}

    public record ReportAccessLogDto(
            UUID id,
            UUID reportId,
            UUID visitId,
            UUID clinicId,
            String parentName,
            String clinicName,
            UUID viewerUserId,
            String viewerName,
            UserRole viewerRole,
            Instant viewedAt
    ) {}
}
