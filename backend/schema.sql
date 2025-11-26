
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    photo TEXT,
    type VARCHAR(50) DEFAULT 'lead',
    status VARCHAR(50) DEFAULT 'Interessado',
    "pipelineId" UUID,
    "stageId" UUID,
    "interestedIn" TEXT[],
    history JSONB DEFAULT '[]'::jsonb,
    "lastContact" DATE,
    "nextFollowUp" DATE,
    "lastPurchase" DATE,
    notes TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(255) PRIMARY KEY,
    data JSONB DEFAULT '{}'::jsonb,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure "updatedAt" is always updated on changes for students
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE PROCEDURE update_students_updated_at();

-- Ensure "updatedAt" is always updated on changes for app_settings
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_app_settings_updated_at ON app_settings;
CREATE TRIGGER set_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE PROCEDURE update_app_settings_updated_at();
