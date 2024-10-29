/*
  Warnings:

  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[AgentPK]` on the table `Agent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[BusinessAccountPK]` on the table `BusinessAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[CustomerPK]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - The required column `AgentPK` was added to the `Agent` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `Agent` table without a default value. This is not possible if the table is not empty.
  - The required column `BusinessAccountPK` was added to the `BusinessAccount` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `BusinessAccount` table without a default value. This is not possible if the table is not empty.
  - The required column `CustomerPK` was added to the `Customer` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_agentId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_customerId_fkey";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "AgentPK" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "BusinessAccount" ADD COLUMN     "BusinessAccountPK" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "CustomerPK" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "conversations";

-- CreateTable
CREATE TABLE " Conversations" (
    "id" TEXT NOT NULL,
    "ConversationPK" TEXT NOT NULL,
    "timeDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "transcript" TEXT,
    "file" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT " Conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX " Conversations_ConversationPK_key" ON " Conversations"("ConversationPK");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_AgentPK_key" ON "Agent"("AgentPK");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAccount_BusinessAccountPK_key" ON "BusinessAccount"("BusinessAccountPK");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_CustomerPK_key" ON "Customer"("CustomerPK");

-- AddForeignKey
ALTER TABLE " Conversations" ADD CONSTRAINT " Conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("AgentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE " Conversations" ADD CONSTRAINT " Conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("CustomerID") ON DELETE RESTRICT ON UPDATE CASCADE;
