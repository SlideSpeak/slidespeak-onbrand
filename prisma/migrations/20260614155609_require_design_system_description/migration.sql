/*
  Warnings:

  - Made the column `description` on table `DesignSystem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DesignSystem" ALTER COLUMN "description" SET NOT NULL;
