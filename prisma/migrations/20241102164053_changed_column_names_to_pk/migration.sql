/*
  Warnings:

  - You are about to drop the column `agentId` on the ` Conversations` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the ` Conversations` table. All the data in the column will be lost.
  - Added the required column `agentPk` to the ` Conversations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPk` to the ` Conversations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE " Conversations" DROP CONSTRAINT " Conversations_agentId_fkey";

-- DropForeignKey
ALTER TABLE " Conversations" DROP CONSTRAINT " Conversations_customerId_fkey";

-- AlterTable
ALTER TABLE " Conversations" DROP COLUMN "agentId",
DROP COLUMN "customerId",
ADD COLUMN     "agentPk" TEXT NOT NULL,
ADD COLUMN     "customerPk" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE " Conversations" ADD CONSTRAINT " Conversations_agentPk_fkey" FOREIGN KEY ("agentPk") REFERENCES "Agent"("AgentPK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE " Conversations" ADD CONSTRAINT " Conversations_customerPk_fkey" FOREIGN KEY ("customerPk") REFERENCES "Customer"("CustomerPK") ON DELETE RESTRICT ON UPDATE CASCADE;
