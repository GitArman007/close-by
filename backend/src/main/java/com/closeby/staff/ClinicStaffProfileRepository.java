package com.closeby.staff;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClinicStaffProfileRepository extends JpaRepository<ClinicStaffProfile, UUID> {
    List<ClinicStaffProfile> findByClinicIdOrderByVerifiedAtDesc(UUID clinicId);
    Optional<ClinicStaffProfile> findByUserId(UUID userId);
    List<ClinicStaffProfile> findByUserIdIn(Collection<UUID> userIds);
}
