-- Database Audit Logging Setup
-- This creates database-level audit triggers for critical tables
-- This is separate from application-level AuditLog and provides defense-in-depth

-- Create database audit log table
CREATE TABLE IF NOT EXISTS database_audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id TEXT,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  transaction_id TEXT,
  application_user_id TEXT -- Links to application user if available
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_database_audit_table_operation ON database_audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_database_audit_user_id ON database_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_database_audit_changed_at ON database_audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_database_audit_application_user ON database_audit_log(application_user_id);

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION database_audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  app_user_id TEXT;
BEGIN
  -- Try to get application user ID from session variable (set by application)
  -- If not set, use PostgreSQL current_user
  app_user_id := current_setting('app.user_id', true);
  IF app_user_id IS NULL OR app_user_id = '' THEN
    app_user_id := current_user;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO database_audit_log (
      table_name,
      operation,
      user_id,
      old_data,
      application_user_id,
      changed_at
    )
    VALUES (
      TG_TABLE_NAME,
      'DELETE',
      current_user,
      row_to_json(OLD),
      app_user_id,
      NOW()
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO database_audit_log (
      table_name,
      operation,
      user_id,
      old_data,
      new_data,
      application_user_id,
      changed_at
    )
    VALUES (
      TG_TABLE_NAME,
      'UPDATE',
      current_user,
      row_to_json(OLD),
      row_to_json(NEW),
      app_user_id,
      NOW()
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO database_audit_log (
      table_name,
      operation,
      user_id,
      new_data,
      application_user_id,
      changed_at
    )
    VALUES (
      TG_TABLE_NAME,
      'INSERT',
      current_user,
      row_to_json(NEW),
      app_user_id,
      NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for critical tables
-- Note: These triggers fire on ALL changes, including those made by the application

-- Election Results (MOST CRITICAL - for tampering detection)
CREATE TRIGGER database_audit_election_results
  AFTER INSERT OR UPDATE OR DELETE ON election_results
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Elections
CREATE TRIGGER database_audit_elections
  AFTER INSERT OR UPDATE OR DELETE ON elections
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Users (for privilege changes and account modifications)
CREATE TRIGGER database_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Candidates
CREATE TRIGGER database_audit_candidates
  AFTER INSERT OR UPDATE OR DELETE ON candidates
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Observer Registrations
CREATE TRIGGER database_audit_observer_registrations
  AFTER INSERT OR UPDATE OR DELETE ON observer_registrations
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Observer Assignments
CREATE TRIGGER database_audit_observer_assignments
  AFTER INSERT OR UPDATE OR DELETE ON observer_assignments
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Election Contests
CREATE TRIGGER database_audit_election_contests
  AFTER INSERT OR UPDATE OR DELETE ON election_contests
  FOR EACH ROW EXECUTE FUNCTION database_audit_trigger_function();

-- Comments for documentation
COMMENT ON TABLE database_audit_log IS 'Database-level audit log for critical table changes. Provides immutable record of all data modifications.';
COMMENT ON FUNCTION database_audit_trigger_function() IS 'Trigger function that logs all INSERT, UPDATE, and DELETE operations on critical tables.';

