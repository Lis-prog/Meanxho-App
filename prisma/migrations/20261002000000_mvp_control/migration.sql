-- AlterTable
ALTER TABLE "User" ALTER COLUMN "timezone" SET DEFAULT 'Europe/Tirane';
ALTER TABLE "User" ADD COLUMN "savingsTargetMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing local accounts already have data; do not send them through onboarding again.
UPDATE "User" SET "onboardingCompletedAt" = "createdAt" WHERE "onboardingCompletedAt" IS NULL;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "obligationId" TEXT;

-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "cadence" TEXT NOT NULL,
    "dueDay" INTEGER,
    "weekday" INTEGER,
    "startOn" TEXT NOT NULL,
    "endOn" TEXT,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObligationPayment" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "expenseId" TEXT,
    "paidOn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObligationPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "originalMinor" INTEGER NOT NULL,
    "remainingMinor" INTEGER NOT NULL,
    "interestBps" INTEGER,
    "endOn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetMinor" INTEGER NOT NULL,
    "currentMinor" INTEGER NOT NULL DEFAULT 0,
    "monthlyContributionMinor" INTEGER NOT NULL DEFAULT 0,
    "deadline" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "monthlyLimitMinor" INTEGER NOT NULL,

    CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_obligationId_idx" ON "Expense"("obligationId");

-- CreateIndex
CREATE INDEX "Obligation_userId_paused_idx" ON "Obligation"("userId", "paused");

-- CreateIndex
CREATE UNIQUE INDEX "ObligationPayment_expenseId_key" ON "ObligationPayment"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "ObligationPayment_obligationId_periodKey_key" ON "ObligationPayment"("obligationId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_obligationId_key" ON "Loan"("obligationId");

-- CreateIndex
CREATE INDEX "Loan_userId_idx" ON "Loan"("userId");

-- CreateIndex
CREATE INDEX "SavingsGoal_userId_archived_idx" ON "SavingsGoal"("userId", "archived");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryBudget_userId_categoryId_key" ON "CategoryBudget"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationPayment" ADD CONSTRAINT "ObligationPayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
