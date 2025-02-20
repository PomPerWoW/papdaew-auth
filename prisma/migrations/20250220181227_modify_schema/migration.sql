/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserPermission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserPermission` table. All the data in the column will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "UserPermission" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "Profile";
