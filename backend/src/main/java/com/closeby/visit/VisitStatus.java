package com.closeby.visit;

import java.util.EnumSet;
import java.util.Set;

public enum VisitStatus {
    REQUESTED,
    ASSIGNED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED;

    public Set<VisitStatus> allowedNextStatuses() {
        return switch (this) {
            case REQUESTED -> EnumSet.of(ASSIGNED, CANCELLED);
            case ASSIGNED -> EnumSet.of(IN_PROGRESS, CANCELLED);
            case IN_PROGRESS -> EnumSet.of(COMPLETED);
            case COMPLETED, CANCELLED -> EnumSet.noneOf(VisitStatus.class);
        };
    }

    public boolean canTransitionTo(VisitStatus next) {
        return allowedNextStatuses().contains(next);
    }
}
