-- closeBy initial relational schema (PostgreSQL + H2 PostgreSQL mode compatible)

CREATE TABLE clinics (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    registration_number VARCHAR(80) NOT NULL UNIQUE,
    locality VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL DEFAULT 'Bhopal',
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    status_reason TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_clinics_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'))
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    clinic_id UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_users_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    CONSTRAINT chk_users_role CHECK (role IN ('PLATFORM_ADMIN', 'CLINIC_ADMIN', 'CLINIC_STAFF', 'FAMILY'))
);

ALTER TABLE clinics
    ADD CONSTRAINT fk_clinics_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id);

CREATE TABLE clinic_staff_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    clinic_id UUID NOT NULL,
    designation VARCHAR(80) NOT NULL,
    verified_by_clinic BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_staff_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

CREATE TABLE parents (
    id UUID PRIMARY KEY,
    family_user_id UUID NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    locality VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    consent_confirmed BOOLEAN NOT NULL,
    consent_confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_parents_family FOREIGN KEY (family_user_id) REFERENCES users(id),
    CONSTRAINT chk_parents_age CHECK (age > 0 AND age < 130),
    CONSTRAINT chk_parents_consent CHECK (consent_confirmed = TRUE)
);

CREATE TABLE visits (
    id UUID PRIMARY KEY,
    family_user_id UUID NOT NULL,
    parent_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    assigned_staff_id UUID,
    service_type VARCHAR(40) NOT NULL,
    scheduled_date DATE NOT NULL,
    preferred_time VARCHAR(40) NOT NULL,
    visit_address TEXT NOT NULL,
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    cancellation_reason TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_visits_family FOREIGN KEY (family_user_id) REFERENCES users(id),
    CONSTRAINT fk_visits_parent FOREIGN KEY (parent_id) REFERENCES parents(id),
    CONSTRAINT fk_visits_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    CONSTRAINT fk_visits_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(id),
    CONSTRAINT chk_visits_service CHECK (service_type IN ('HOME_VITALS_CHECK', 'SAMPLE_COLLECTION', 'FOLLOW_UP_VISIT', 'MEDICINE_ADHERENCE_CHECK')),
    CONSTRAINT chk_visits_status CHECK (status IN ('REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE visit_reports (
    id UUID PRIMARY KEY,
    visit_id UUID NOT NULL UNIQUE,
    clinic_id UUID NOT NULL,
    recorded_by_staff_id UUID NOT NULL,
    bp_systolic INT,
    bp_diastolic INT,
    temperature_f NUMERIC(4, 1),
    blood_sugar_mg_dl INT,
    blood_sugar_context VARCHAR(30),
    observation_notes TEXT NOT NULL,
    recommendation VARCHAR(30) NOT NULL DEFAULT 'NONE',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_reports_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
    CONSTRAINT fk_reports_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    CONSTRAINT fk_reports_staff FOREIGN KEY (recorded_by_staff_id) REFERENCES users(id),
    CONSTRAINT chk_reports_sugar_ctx CHECK (blood_sugar_context IS NULL OR blood_sugar_context IN ('FASTING', 'POST_MEAL', 'RANDOM')),
    CONSTRAINT chk_reports_rec CHECK (recommendation IN ('NONE', 'FOLLOW_UP_VISIT', 'DOCTOR_CONSULT'))
);

CREATE TABLE report_access_logs (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    viewer_user_id UUID NOT NULL,
    viewer_role VARCHAR(30) NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_access_logs_report FOREIGN KEY (report_id) REFERENCES visit_reports(id),
    CONSTRAINT fk_access_logs_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
    CONSTRAINT fk_access_logs_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id),
    CONSTRAINT fk_access_logs_viewer FOREIGN KEY (viewer_user_id) REFERENCES users(id)
);

CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_staff_clinic_id ON clinic_staff_profiles(clinic_id);
CREATE INDEX idx_parents_family_user_id ON parents(family_user_id);
CREATE INDEX idx_visits_clinic_status ON visits(clinic_id, status);
CREATE INDEX idx_visits_family_created ON visits(family_user_id, created_at DESC);
CREATE INDEX idx_visits_staff_status ON visits(assigned_staff_id, status);
CREATE INDEX idx_reports_clinic_recorded ON visit_reports(clinic_id, recorded_at DESC);
CREATE INDEX idx_report_access_logs_report_viewed ON report_access_logs(report_id, viewed_at DESC);
CREATE INDEX idx_report_access_logs_clinic_viewed ON report_access_logs(clinic_id, viewed_at DESC);
