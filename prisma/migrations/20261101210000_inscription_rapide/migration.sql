-- Rendre les champs identité optionnels pour les comptes express (email + mdp uniquement)
ALTER TABLE "Utilisateur" ALTER COLUMN "nom" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "prenom" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "civilite" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "date_de_naissance" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "numero_tel" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "adresse" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "ville" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "code_postal" DROP NOT NULL;
ALTER TABLE "Utilisateur" ALTER COLUMN "pays" DROP NOT NULL;

-- Ajouter le flag profil_complet (false par défaut pour les nouveaux comptes express)
ALTER TABLE "Utilisateur" ADD COLUMN "profil_complet" BOOLEAN NOT NULL DEFAULT false;

-- Tous les comptes existants ont un profil complet
UPDATE "Utilisateur" SET "profil_complet" = true;
