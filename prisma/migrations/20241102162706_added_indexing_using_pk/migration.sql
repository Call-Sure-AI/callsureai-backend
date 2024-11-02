-- DropForeignKey
ALTER TABLE " Conversations" DROP CONSTRAINT " Conversations_agentId_fkey";

-- DropForeignKey
ALTER TABLE " Conversations" DROP CONSTRAINT " Conversations_customerId_fkey";

-- CreateIndex
CREATE INDEX "ConversationPK" ON " Conversations"("ConversationPK");

-- CreateIndex
CREATE INDEX "AgentPK" ON "Agent"("AgentPK");

-- CreateIndex
CREATE INDEX "BusinessAccountPK" ON "BusinessAccount"("BusinessAccountPK");

-- CreateIndex
CREATE INDEX "CustomerPK" ON "Customer"("CustomerPK");

-- AddForeignKey
ALTER TABLE " Conversations" ADD CONSTRAINT " Conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("AgentPK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE " Conversations" ADD CONSTRAINT " Conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("CustomerPK") ON DELETE RESTRICT ON UPDATE CASCADE;
