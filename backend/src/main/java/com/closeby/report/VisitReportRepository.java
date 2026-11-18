package com.closeby.report;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VisitReportRepository extends JpaRepository<VisitReport, UUID> {
    Optional<VisitReport> findByVisitId(UUID visitId);
    boolean existsByVisitId(UUID visitId);
    List<VisitReport> findByClinicIdOrderByRecordedAtDesc(UUID clinicId);
    List<VisitReport> findByVisitIdInOrderByRecordedAtAsc(Collection<UUID> visitIds);
}
