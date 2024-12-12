/*
  Warnings:

  - You are about to drop the `agents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "agents" DROP CONSTRAINT "agents_company_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_company_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_current_agent_id_fkey";

-- DropTable
DROP TABLE "agents";

-- DropTable
DROP TABLE "companies";

-- DropTable
DROP TABLE "conversations";

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "company_id" TEXT,
    "prompt" TEXT NOT NULL,
    "additional_context" JSON,
    "confidence_threshold" DOUBLE PRECISION,
    "files" VARCHAR(255)[],
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "template_id" VARCHAR(255),

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "business_name" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "website" VARCHAR(255),
    "logo" VARCHAR(255),
    "prompt_templates" JSONB DEFAULT '{}',
    "api_key" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),
    "settings" JSON,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "customer_id" VARCHAR(255) NOT NULL,
    "company_id" TEXT,
    "current_agent_id" TEXT,
    "history" JSONB,
    "meta_data" JSON,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" SERIAL NOT NULL,
    "call_sid" VARCHAR(255),
    "company_id" TEXT,
    "from_number" VARCHAR(20) NOT NULL,
    "to_number" VARCHAR(20) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "duration" INTEGER,
    "recording_url" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_agents_user_id" ON "Agent"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_api_key_key" ON "Company"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "Company_phone_number_key" ON "Company"("phone_number");

-- CreateIndex
CREATE INDEX "idx_companies_user_id" ON "Company"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Call_call_sid_key" ON "Call"("call_sid");

-- CreateIndex
CREATE INDEX "idx_calls_company_id" ON "Call"("company_id");

-- CreateIndex
CREATE INDEX "idx_calls_created_at" ON "Call"("created_at");

-- CreateIndex
CREATE INDEX "idx_calls_status" ON "Call"("status");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_current_agent_id_fkey" FOREIGN KEY ("current_agent_id") REFERENCES "Agent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
