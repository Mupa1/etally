-- Ensure ObserverStatus enum exists (handles shadow database)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ObserverStatus'
    ) THEN
        CREATE TYPE "ObserverStatus" AS ENUM (
            'pending_review',
            'more_information_requested',
            'approved',
            'active',
            'rejected',
            'suspended',
            'inactive'
        );
    END IF;
END
$$;

-- Add enum value (idempotent)
ALTER TYPE "ObserverStatus" ADD VALUE IF NOT EXISTS 'more_information_requested';

