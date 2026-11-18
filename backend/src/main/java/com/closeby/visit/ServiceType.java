package com.closeby.visit;

public enum ServiceType {
    HOME_VITALS_CHECK("Home vitals check"),
    SAMPLE_COLLECTION("Sample collection"),
    FOLLOW_UP_VISIT("Follow-up visit"),
    MEDICINE_ADHERENCE_CHECK("Medicine adherence check");

    private final String displayLabel;

    ServiceType(String displayLabel) {
        this.displayLabel = displayLabel;
    }

    public String getDisplayLabel() {
        return displayLabel;
    }
}
