-- CreateTable
CREATE TABLE "BusinessAccount" (
    "id" TEXT NOT NULL,
    "BusinessType" TEXT NOT NULL,
    "BusinessDesc" TEXT NOT NULL,
    "BusinessReport" TEXT NOT NULL,

    CONSTRAINT "BusinessAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "CustomerID" TEXT NOT NULL,
    "CustomerName" TEXT NOT NULL,
    "CustomerDescript" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("CustomerID")
);

-- CreateTable
CREATE TABLE "Agent" (
    "AgentID" TEXT NOT NULL,
    "AgentName" TEXT NOT NULL,
    "AgentSpec" TEXT NOT NULL,
    "AgentDescription" TEXT NOT NULL,
    "Generate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("AgentID")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "timeDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "transcript" TEXT,
    "file" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BusinessCustomer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CustomerAgent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessCustomer_AB_unique" ON "_BusinessCustomer"("A", "B");

-- CreateIndex
CREATE INDEX "_BusinessCustomer_B_index" ON "_BusinessCustomer"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerAgent_AB_unique" ON "_CustomerAgent"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerAgent_B_index" ON "_CustomerAgent"("B");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("CustomerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("AgentID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessCustomer" ADD CONSTRAINT "_BusinessCustomer_A_fkey" FOREIGN KEY ("A") REFERENCES "BusinessAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessCustomer" ADD CONSTRAINT "_BusinessCustomer_B_fkey" FOREIGN KEY ("B") REFERENCES "Customer"("CustomerID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerAgent" ADD CONSTRAINT "_CustomerAgent_A_fkey" FOREIGN KEY ("A") REFERENCES "Agent"("AgentID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerAgent" ADD CONSTRAINT "_CustomerAgent_B_fkey" FOREIGN KEY ("B") REFERENCES "Customer"("CustomerID") ON DELETE CASCADE ON UPDATE CASCADE;
