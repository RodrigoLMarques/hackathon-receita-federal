-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HistoryType" ADD VALUE 'SHORT_SHORT';
ALTER TYPE "HistoryType" ADD VALUE 'LONG_LONG';
ALTER TYPE "HistoryType" ADD VALUE 'SHORT_LONG';
