ALTER TABLE "Raffle" ADD COLUMN "yapePhone" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Raffle_yapePhone_idx" ON "Raffle"("yapePhone");
