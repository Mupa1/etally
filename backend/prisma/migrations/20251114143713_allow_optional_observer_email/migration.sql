-- AlterTable
ALTER TABLE "observer_registrations" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
