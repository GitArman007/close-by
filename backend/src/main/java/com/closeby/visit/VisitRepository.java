package com.closeby.visit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VisitRepository extends JpaRepository<Visit, UUID> {
    List<Visit> findByFamilyUserIdOrderByCreatedAtDesc(UUID familyUserId);
    List<Visit> findByFamilyUserIdAndStatusOrderByCreatedAtDesc(UUID familyUserId, VisitStatus status);
    List<Visit> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);
    List<Visit> findByClinicIdAndStatusOrderByCreatedAtDesc(UUID clinicId, VisitStatus status);
    List<Visit> findByAssignedStaffIdOrderByScheduledDateAsc(UUID assignedStaffId);
    List<Visit> findByAssignedStaffIdAndStatusOrderByScheduledDateAsc(UUID assignedStaffId, VisitStatus status);
    List<Visit> findByParentIdOrderByCreatedAtDesc(UUID parentId);
}
