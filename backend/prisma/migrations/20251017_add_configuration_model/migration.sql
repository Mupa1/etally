-- CreateEnum (guarded for repeated runs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'ConfigurationType'
    ) THEN
        CREATE TYPE "ConfigurationType" AS ENUM ('string', 'number', 'boolean', 'json');
    END IF;
END
$$;

-- CreateTable (guarded for repeated runs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'configurations'
    ) THEN
        CREATE TABLE "configurations" (
            "id" TEXT NOT NULL,
            "key" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "value" TEXT,
            "type" "ConfigurationType" NOT NULL DEFAULT 'string',
            "category" TEXT NOT NULL,
            "isRequired" BOOLEAN NOT NULL DEFAULT false,
            "isDefault" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "modifiedBy" TEXT,

            CONSTRAINT "configurations_pkey" PRIMARY KEY ("id")
        );
    END IF;
END
$$;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "configurations_key_key" ON "configurations"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "configurations_category_idx" ON "configurations"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "configurations_key_idx" ON "configurations"("key");

