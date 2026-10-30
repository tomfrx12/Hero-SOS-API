import { Router } from "express";
import { me } from "../controleurs/auth.controleur";
import { changerMotDePasse, changerPhoto, demanderChangementEmail, maReputation, mesIncidents, mesStatistiques, modifierProfil, noterHeros, repondreAvis } from "../controleurs/moi.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";
import { uploadPhoto } from "../services/upload";

const router = Router();

// Toutes les routes concernent l'utilisateur connecté
router.use(authentifier);

router.get("/", me);
router.patch("/", modifierProfil);
router.patch("/email", demanderChangementEmail);
router.patch("/mot-de-passe", changerMotDePasse);
router.post("/photo", uploadPhoto.single("photo"), changerPhoto);

// Incidents signalés par l'utilisateur (citoyen ou admin, comme pour POST /incidents)
router.get("/incidents", autoriser("Citoyens", "Administrateurs"), mesIncidents);
router.post("/notes", autoriser("Citoyens", "Administrateurs"), noterHeros);

// Espace super-héros
router.get("/statistiques", autoriser("SuperHeros"), mesStatistiques);
router.get("/reputation", autoriser("SuperHeros"), maReputation);
router.patch("/notes/:id/reponse", autoriser("SuperHeros"), repondreAvis);

export default router;
