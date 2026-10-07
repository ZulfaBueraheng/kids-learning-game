-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "subjectCode" TEXT NOT NULL DEFAULT 'MATH';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "activeSubject" TEXT NOT NULL DEFAULT 'MATH';

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "emoji" TEXT NOT NULL DEFAULT '📚',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

