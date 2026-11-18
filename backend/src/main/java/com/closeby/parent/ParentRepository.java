package com.closeby.parent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ParentRepository extends JpaRepository<Parent, UUID> {
    List<Parent> findByFamilyUserIdOrderByCreatedAtDesc(UUID familyUserId);
    List<Parent> findAllByIdIn(Collection<UUID> ids);
}
