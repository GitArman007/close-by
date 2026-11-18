package com.closeby.common;

public final class ClinicalSafetyConstants {

    private ClinicalSafetyConstants() {}

    public static final String EMERGENCY_NOTICE = "In an emergency, call 108 or 112";
    public static final String OBSERVATIONS_DISCLAIMER =
            "Observations only. This slip records measurements taken during a home visit and is not a medical diagnosis or prescription.";
    public static final String VERIFIED_BY_PREFIX = "Verified by ";

    public static String verifiedBy(String clinicName) {
        return VERIFIED_BY_PREFIX + clinicName;
    }
}
