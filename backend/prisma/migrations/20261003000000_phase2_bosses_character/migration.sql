-- CreateEnum
CREATE TYPE "ItemSlot" AS ENUM ('HAT', 'OUTFIT', 'PET', 'ACCESSORY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'PUZZLE';
ALTER TYPE "ActivityType" ADD VALUE 'SHOP';
ALTER TYPE "ActivityType" ADD VALUE 'MAGIC';
ALTER TYPE "ActivityType" ADD VALUE 'BOSS';

-- AlterTable
ALTER TABLE "Achievement" ADD COLUMN     "coinReward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GameLevel" ADD COLUMN     "bossEmoji" TEXT;

-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "coinsEarned" INTEGER;

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" "ItemSlot" NOT NULL,
    "emoji" TEXT NOT NULL,
    "price" INTEGER,
    "rewardWorldCode" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentItem" (
    "studentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentItem_pkey" PRIMARY KEY ("studentId","itemId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_code_key" ON "Item"("code");

-- AddForeignKey
ALTER TABLE "StudentItem" ADD CONSTRAINT "StudentItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentItem" ADD CONSTRAINT "StudentItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

