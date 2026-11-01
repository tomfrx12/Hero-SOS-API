/*
  Warnings:

  - The values [SuperVillains] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `utilisateurId` on the `SuperVilain` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('Citoyens', 'SuperHeros', 'Administrateurs');
ALTER TABLE "public"."Utilisateur" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Utilisateur" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "Utilisateur" ALTER COLUMN "role" SET DEFAULT 'Citoyens';
COMMIT;

-- DropForeignKey
ALTER TABLE "SuperVilain" DROP CONSTRAINT "SuperVilain_utilisateurId_fkey";

-- DropIndex
DROP INDEX "SuperVilain_utilisateurId_key";

-- AlterTable
ALTER TABLE "SuperVilain" DROP COLUMN "utilisateurId",
ADD COLUMN     "photo" TEXT;
