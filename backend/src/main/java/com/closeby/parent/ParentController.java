package com.closeby.parent;

import com.closeby.auth.AuthPrincipal;
import com.closeby.parent.ParentDtos.CreateParentRequest;
import com.closeby.parent.ParentDtos.ParentDto;
import com.closeby.parent.ParentDtos.UpdateParentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/parents")
@PreAuthorize("hasRole('FAMILY')")
@Tag(name = "Parents", description = "Family-owned parent profiles with mandatory timestamped consent")
public class ParentController {

    private final ParentService parentService;

    public ParentController(ParentService parentService) {
        this.parentService = parentService;
    }

    @GetMapping
    @Operation(summary = "List parent profiles belonging to the authenticated family")
    public List<ParentDto> listOwnParents(@AuthenticationPrincipal AuthPrincipal principal) {
        return parentService.listOwnParents(principal);
    }

    @GetMapping("/{parentId}")
    @Operation(summary = "Get a parent profile owned by the authenticated family")
    public ParentDto getOwnParent(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID parentId
    ) {
        return parentService.getOwnParent(principal, parentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a parent profile (requires consentConfirmed=true; saves server UTC timestamp)")
    public ParentDto createParent(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody CreateParentRequest request
    ) {
        return parentService.createParent(principal, request);
    }

    @PutMapping("/{parentId}")
    @Operation(summary = "Update a parent profile owned by the authenticated family")
    public ParentDto updateParent(
            @AuthenticationPrincipal AuthPrincipal principal,
            @PathVariable UUID parentId,
            @Valid @RequestBody UpdateParentRequest request
    ) {
        return parentService.updateParent(principal, parentId, request);
    }
}
