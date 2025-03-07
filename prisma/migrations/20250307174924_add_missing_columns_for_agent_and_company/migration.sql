/*
  Warnings:

  - A unique constraint covering the columns `[qdrant_collection_name]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "average_confidence" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "average_response_time" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "database_integration_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "image_processing_config" JSONB DEFAULT '{"max_images": 1000, "confidence_threshold": 0.7, "enable_auto_description": true}',
ADD COLUMN     "image_processing_enabled" BOOLEAN DEFAULT false,
ADD COLUMN     "knowledge_base_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "max_response_tokens" INTEGER DEFAULT 200,
ADD COLUMN     "search_config" JSONB DEFAULT '{"score_threshold": 0.7, "limit": 5, "include_metadata": true}',
ADD COLUMN     "success_rate" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "temperature" DOUBLE PRECISION DEFAULT 0.7,
ADD COLUMN     "total_interactions" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "active" BOOLEAN DEFAULT true,
ADD COLUMN     "average_response_time" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "business_type" VARCHAR(100),
ADD COLUMN     "current_image_storage" INTEGER DEFAULT 0,
ADD COLUMN     "image_config" JSONB DEFAULT '{"enable_auto_tagging": true, "enable_explicit_content_detection": true, "retention_period_days": 365, "max_image_size": 10485760, "supported_formats": ["image/jpeg", "image/png", "image/gif"]}',
ADD COLUMN     "image_storage_limit" INTEGER DEFAULT 10737418240,
ADD COLUMN     "qdrant_collection_name" TEXT,
ADD COLUMN     "total_conversations" INTEGER DEFAULT 0,
ADD COLUMN     "vector_dimension" INTEGER DEFAULT 1536;

-- CreateIndex
CREATE UNIQUE INDEX "Company_qdrant_collection_name_key" ON "Company"("qdrant_collection_name");
