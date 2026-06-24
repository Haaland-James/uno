-- CreateTable
CREATE TABLE "PropertyDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleHint" TEXT,
    "addressHint" TEXT,
    "mainPhotoUrl" TEXT,
    "data" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyDraft_userId_updatedAt_idx" ON "PropertyDraft"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "PropertyDraft" ADD CONSTRAINT "PropertyDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
