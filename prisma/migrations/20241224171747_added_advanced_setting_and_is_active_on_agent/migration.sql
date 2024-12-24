-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "advanced_settings" JSON,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
