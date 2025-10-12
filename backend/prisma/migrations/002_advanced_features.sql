-- ==========================================
-- ADVANCED POSTGRESQL FEATURES
-- Election Management System
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ==========================================
-- CREATE AUTH SCHEMA FOR RLS
-- ==========================================

CREATE SCHEMA IF NOT EXISTS auth;

-- ==========================================
-- CHECK CONSTRAINTS (using correct camelCase column names)
-- ==========================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_votes_positive') THEN
        ALTER TABLE election_results ADD CONSTRAINT check_votes_positive CHECK (votes >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_accuracy_positive') THEN
        ALTER TABLE election_results ADD CONSTRAINT check_accuracy_positive CHECK ("accuracyMeters" IS NULL OR "accuracyMeters" >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_failed_attempts') THEN
        ALTER TABLE users ADD CONSTRAINT check_failed_attempts CHECK ("failedLoginAttempts" >= 0 AND "failedLoginAttempts" <= 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_registered_voters') THEN
        ALTER TABLE polling_stations ADD CONSTRAINT check_registered_voters CHECK ("registeredVoters" >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_retry_count') THEN
        ALTER TABLE offline_actions ADD CONSTRAINT check_retry_count CHECK ("retryCount" >= 0 AND "retryCount" <= 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_request_count') THEN
        ALTER TABLE rate_limits ADD CONSTRAINT check_request_count CHECK ("requestCount" >= 0);
    END IF;
END $$;

-- ==========================================
-- GEOGRAPHY COLUMNS FOR SPATIAL QUERIES
-- (Already added in previous run, but safe to check)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'election_results' AND column_name = 'location_geography'
    ) THEN
        ALTER TABLE election_results 
        ADD COLUMN location_geography geography(Point, 4326) 
        GENERATED ALWAYS AS (
          CASE 
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            ELSE NULL 
          END
        ) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'polling_stations' AND column_name = 'location_geography'
    ) THEN
        ALTER TABLE polling_stations
        ADD COLUMN location_geography geography(Point, 4326)
        GENERATED ALWAYS AS (
          CASE
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            ELSE NULL
          END
        ) STORED;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'incidents' AND column_name = 'location_geography'
    ) THEN
        ALTER TABLE incidents
        ADD COLUMN location_geography geography(Point, 4326)
        GENERATED ALWAYS AS (
          CASE
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL
            THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            ELSE NULL
          END
        ) STORED;
    END IF;
END $$;

-- Spatial indexes
CREATE INDEX IF NOT EXISTS idx_results_location_spatial 
ON election_results USING GIST (location_geography);

CREATE INDEX IF NOT EXISTS idx_stations_location_spatial
ON polling_stations USING GIST (location_geography);

CREATE INDEX IF NOT EXISTS idx_incidents_location_spatial
ON incidents USING GIST (location_geography);

-- ==========================================
-- FULL-TEXT SEARCH (Using correct camelCase column names)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_candidates_name_search 
ON candidates USING gin(to_tsvector('english', "fullName"));

CREATE INDEX IF NOT EXISTS idx_parties_name_search
ON political_parties USING gin(to_tsvector('english', "partyName" || ' ' || COALESCE(acronym, '')));

CREATE INDEX IF NOT EXISTS idx_elections_title_search
ON elections USING gin(to_tsvector('english', title));

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Create auth context function
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: RLS policies are commented out for initial development
-- Uncomment when ready to enable RLS

-- ==========================================
-- MATERIALIZED VIEWS FOR REPORTING
-- ==========================================

-- Drop existing views if they exist
DROP MATERIALIZED VIEW IF EXISTS election_summary_view CASCADE;
DROP VIEW IF EXISTS live_results_view CASCADE;

-- Create materialized view with correct column names
CREATE MATERIALIZED VIEW election_summary_view AS
SELECT 
    e.id,
    e."electionCode" as election_code,
    e.title,
    e."electionDate" as election_date,
    e.status::text,
    e."electionType"::text as election_type,
    COUNT(DISTINCT ec.id) as contest_count,
    COUNT(DISTINCT c.id) as candidate_count,
    COUNT(DISTINCT er.id) as result_count,
    COALESCE(SUM(er.votes), 0) as total_votes,
    COUNT(DISTINCT er."pollingStationId") as stations_reporting
FROM elections e
LEFT JOIN election_contests ec ON e.id = ec."electionId"
LEFT JOIN candidates c ON ec.id = c."contestId"
LEFT JOIN election_results er ON ec.id = er."contestId"
GROUP BY e.id, e."electionCode", e.title, e."electionDate", e.status, e."electionType";

CREATE UNIQUE INDEX idx_election_summary ON election_summary_view(id);
CREATE INDEX idx_election_summary_status ON election_summary_view(status);

-- Live results view
CREATE VIEW live_results_view AS
SELECT 
    e.id as election_id,
    e.title as election_title,
    ec.id as contest_id,
    ec."positionName" as position_name,
    c.id as candidate_id,
    c."fullName" as candidate_name,
    c."candidateNumber" as candidate_number,
    p."partyName" as party_name,
    p.acronym as party_acronym,
    COALESCE(SUM(er.votes), 0) as total_votes,
    COUNT(DISTINCT er."pollingStationId") as stations_reporting,
    er."resultStatus"::text as result_status,
    MAX(er."updatedAt") as last_updated
FROM elections e
JOIN election_contests ec ON e.id = ec."electionId"
JOIN candidates c ON ec.id = c."contestId"
LEFT JOIN political_parties p ON c."partyId" = p.id
LEFT JOIN election_results er ON ec.id = er."contestId" AND c.id = er."candidateId"
WHERE e.status IN ('active', 'completed')
GROUP BY e.id, e.title, ec.id, ec."positionName", c.id, c."fullName", 
         c."candidateNumber", p."partyName", p.acronym, er."resultStatus";

-- ==========================================
-- MAINTENANCE FUNCTIONS
-- ==========================================

-- Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY election_summary_view;
END;
$$ LANGUAGE plpgsql;

-- Database maintenance
CREATE OR REPLACE FUNCTION perform_database_maintenance()
RETURNS void AS $$
BEGIN
    -- Vacuum and analyze
    VACUUM ANALYZE;
    
    -- Refresh materialized views (only if they have data)
    BEGIN
        PERFORM refresh_materialized_views();
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Could not refresh materialized views: %', SQLERRM;
    END;
    
    -- Clean up old rate limit records (older than 1 hour)
    DELETE FROM rate_limits WHERE "windowStart" < NOW() - INTERVAL '1 hour';
    
    -- Clean up expired sessions
    DELETE FROM sessions WHERE "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger to auto-update materialized views on result changes
CREATE OR REPLACE FUNCTION trigger_refresh_election_summary()
RETURNS trigger AS $$
BEGIN
    -- Async refresh to avoid blocking
    PERFORM pg_notify('refresh_views', COALESCE(NEW."electionId", OLD."electionId")::text);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_result_change ON election_results;
CREATE TRIGGER after_result_change
AFTER INSERT OR UPDATE OR DELETE ON election_results
FOR EACH ROW EXECUTE FUNCTION trigger_refresh_election_summary();