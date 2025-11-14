-- CreateTable
CREATE TABLE "coalitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "description" TEXT,
    "isCompetitor" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "coalitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "party_coalitions" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "coalitionId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_coalitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coalitions_name_idx" ON "coalitions"("name");

-- CreateIndex
CREATE INDEX "coalitions_isActive_idx" ON "coalitions"("isActive");

-- CreateIndex
CREATE INDEX "coalitions_isCompetitor_idx" ON "coalitions"("isCompetitor");

-- CreateIndex
CREATE INDEX "party_coalitions_partyId_idx" ON "party_coalitions"("partyId");

-- CreateIndex
CREATE INDEX "party_coalitions_coalitionId_idx" ON "party_coalitions"("coalitionId");

-- CreateIndex
CREATE UNIQUE INDEX "party_coalitions_partyId_coalitionId_key" ON "party_coalitions"("partyId", "coalitionId");

-- AddForeignKey
ALTER TABLE "party_coalitions" ADD CONSTRAINT "party_coalitions_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "political_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_coalitions" ADD CONSTRAINT "party_coalitions_coalitionId_fkey" FOREIGN KEY ("coalitionId") REFERENCES "coalitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
