-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MASTER', 'CONTADOR', 'CONSULTOR', 'DESIGNER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSULTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowed_emails" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "allowed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_costs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "due_day" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "fixed_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variable_costs" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "ad_accounts_purchase" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "gateway_percentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "withdrawal_count" INTEGER NOT NULL DEFAULT 0,
    "withdrawal_total" DECIMAL(65,30),
    "p2p_transfers" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "p2p_fees" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "variable_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sporadic_costs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sporadic_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "total_revenue" DECIMAL(65,30) NOT NULL,
    "sales_count" INTEGER NOT NULL,
    "traffic_investment" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_status" (
    "id" TEXT NOT NULL,
    "fixed_cost_id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "payment_date" TIMESTAMP(3),
    "amount_paid" DECIMAL(65,30),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "payment_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "allowed_emails_email_key" ON "allowed_emails"("email");

-- CreateIndex
CREATE UNIQUE INDEX "feature_permissions_userId_feature_key" ON "feature_permissions"("userId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "variable_costs_user_id_month_key" ON "variable_costs"("user_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_user_id_month_key" ON "revenue"("user_id", "month");

-- AddForeignKey
ALTER TABLE "feature_permissions" ADD CONSTRAINT "feature_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
