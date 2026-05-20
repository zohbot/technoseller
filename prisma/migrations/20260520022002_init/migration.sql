-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "regionsJson" TEXT NOT NULL,
    "servicesJson" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "responseTime" TEXT NOT NULL,
    "headquarters" TEXT NOT NULL,
    "founded" INTEGER NOT NULL,
    "teamSize" TEXT NOT NULL,
    "leadScore" INTEGER NOT NULL,
    "opportunitiesJson" TEXT NOT NULL,
    "capabilitiesJson" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorSlug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "need" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'needs-review',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_vendorSlug_fkey" FOREIGN KEY ("vendorSlug") REFERENCES "Vendor" ("slug") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

-- CreateIndex
CREATE INDEX "Vendor_leadScore_idx" ON "Vendor"("leadScore");

-- CreateIndex
CREATE INDEX "Vendor_verificationStatus_idx" ON "Vendor"("verificationStatus");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_vendorSlug_idx" ON "Lead"("vendorSlug");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
