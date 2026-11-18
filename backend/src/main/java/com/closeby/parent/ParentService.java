package com.closeby.parent;

import com.closeby.auth.AuthPrincipal;
import com.closeby.auth.UserRole;
import com.closeby.common.CloseByException;
import com.closeby.parent.ParentDtos.CreateParentRequest;
import com.closeby.parent.ParentDtos.ParentDto;
import com.closeby.parent.ParentDtos.UpdateParentRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ParentService {

    private final ParentRepository parentRepository;

    public ParentService(ParentRepository parentRepository) {
        this.parentRepository = parentRepository;
    }

    @Transactional(readOnly = true)
    public List<ParentDto> listOwnParents(AuthPrincipal principal) {
        principal.requireRole(UserRole.FAMILY);
        return parentRepository.findByFamilyUserIdOrderByCreatedAtDesc(principal.userId())
                .stream()
                .map(ParentDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParentDto getOwnParent(AuthPrincipal principal, UUID parentId) {
        principal.requireRole(UserRole.FAMILY);
        return ParentDto.from(requireOwnedParent(principal, parentId));
    }

    @Transactional
    public ParentDto createParent(AuthPrincipal principal, CreateParentRequest request) {
        principal.requireRole(UserRole.FAMILY);
        if (!Boolean.TRUE.equals(request.consentConfirmed())) {
            throw CloseByException.badRequest(
                    "Parent consent must be confirmed before adding a parent profile."
            );
        }

        Instant now = Instant.now();
        Parent parent = new Parent(
                UUID.randomUUID(),
                principal.userId(),
                request.fullName().trim(),
                request.age(),
                request.gender().trim(),
                trimNullable(request.phone()),
                request.locality().trim(),
                request.address().trim(),
                trimNullable(request.notes()),
                now,
                now
        );
        return ParentDto.from(parentRepository.save(parent));
    }

    @Transactional
    public ParentDto updateParent(AuthPrincipal principal, UUID parentId, UpdateParentRequest request) {
        principal.requireRole(UserRole.FAMILY);
        Parent parent = requireOwnedParent(principal, parentId);
        parent.updateDetails(
                request.fullName().trim(),
                request.age(),
                request.gender().trim(),
                trimNullable(request.phone()),
                request.locality().trim(),
                request.address().trim(),
                trimNullable(request.notes())
        );
        return ParentDto.from(parentRepository.save(parent));
    }

    /**
     * Service-layer family ownership guard reused across ParentService, VisitService, and ReportService.
     */
    public Parent requireOwnedParent(AuthPrincipal principal, UUID parentId) {
        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> CloseByException.notFound("Parent profile not found."));
        if (!parent.getFamilyUserId().equals(principal.userId())) {
            throw CloseByException.forbidden("You cannot access a parent profile belonging to another family.");
        }
        return parent;
    }

    private String trimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
