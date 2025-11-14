-- CreateEnum
CREATE TYPE "SmsTemplateType" AS ENUM ('registration_confirmation', 'password_setup', 'welcome', 'rejection', 'clarification_request', 'election_update', 'general_notification');

-- CreateTable
CREATE TABLE "sms_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "description" TEXT,
    "templateType" "SmsTemplateType" NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_templateType_key" ON "sms_templates"("templateType");

-- CreateIndex
CREATE INDEX "sms_templates_templateType_idx" ON "sms_templates"("templateType");

-- CreateIndex
CREATE INDEX "sms_templates_isActive_idx" ON "sms_templates"("isActive");
