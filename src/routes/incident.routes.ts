import { Router } from "express";
import { changerUrgence, creerIncident, incidentsRecents, incidentsEnCours, intervenir, listerDoublons, modifierIncident, supprimerIncident, terminerIntervention, listerIncidents, recupererIncident } from "../controleurs/incident.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.get("/", authentifier, listerIncidents);
router.get("/recents", incidentsRecents);
router.get("/en-cours", incidentsEnCours);
router.get("/:id/doublons", authentifier, autoriser("Administrateurs"), listerDoublons);
router.get("/:id", authentifier, recupererIncident);
router.post("/", authentifier, autoriser("Citoyens", "Administrateurs"), creerIncident);
router.post("/:id/intervention", authentifier, autoriser("SuperHeros"), intervenir);
router.patch("/:id/intervention", authentifier, autoriser("SuperHeros"), terminerIntervention);
router.patch("/:id/urgence", authentifier, autoriser("SuperHeros", "Administrateurs"), changerUrgence);
router.patch("/:id", authentifier, autoriser("Administrateurs"), modifierIncident);
router.delete("/:id", authentifier, autoriser("Administrateurs"), supprimerIncident);

export default router;
