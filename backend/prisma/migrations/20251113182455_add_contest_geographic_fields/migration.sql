-- AlterTable
ALTER TABLE "election_contests" ADD COLUMN     "constituencyId" TEXT,
ADD COLUMN     "contestType" TEXT,
ADD COLUMN     "countyId" TEXT,
ADD COLUMN     "postponedDate" TIMESTAMP(3),
ADD COLUMN     "wardId" TEXT;

-- CreateIndex
CREATE INDEX "election_contests_countyId_idx" ON "election_contests"("countyId");

-- CreateIndex
CREATE INDEX "election_contests_constituencyId_idx" ON "election_contests"("constituencyId");

-- CreateIndex
CREATE INDEX "election_contests_wardId_idx" ON "election_contests"("wardId");

-- CreateIndex
CREATE INDEX "election_contests_contestType_idx" ON "election_contests"("contestType");

-- AddForeignKey
ALTER TABLE "election_contests" ADD CONSTRAINT "election_contests_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "counties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_contests" ADD CONSTRAINT "election_contests_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_contests" ADD CONSTRAINT "election_contests_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "electoral_wards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
