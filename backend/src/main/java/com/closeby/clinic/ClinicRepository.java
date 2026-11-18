package com.closeby.clinic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClinicRepository extends JpaRepository<Clinic, UUID> {
    boolean existsByRegistrationNumberIgnoreCase(String registrationNumber);
    List<Clinic> findByStatusOrderByNameAsc(ClinicStatus status);
    List<Clinic> findAllByOrderByCreatedAtDesc();
    long countByStatus(ClinicStatus status);
}
