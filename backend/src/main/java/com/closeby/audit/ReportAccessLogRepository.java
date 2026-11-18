package com.closeby.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ReportAccessLogRepository extends JpaRepository<ReportAccessLog, UUID> {
    List<ReportAccessLog> findByReportIdOrderByViewedAtDesc(UUID reportId);
    List<ReportAccessLog> findByClinicIdOrderByViewedAtDesc(UUID clinicId);
    List<ReportAccessLog> findByVisitIdInOrderByViewedAtDesc(Collection<UUID> visitIds);
    long countByReportId(UUID reportId);
}
