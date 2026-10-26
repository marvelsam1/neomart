CREATE TYPE "BusinessType" AS ENUM ('ARTISAN', 'VENDOR');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "vendor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "description" TEXT NOT NULL,
    "businessEmail" TEXT,
    "businessPhone" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_profiles_userId_key" ON "vendor_profiles"("userId");

ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;