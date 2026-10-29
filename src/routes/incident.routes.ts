import { Router } from "express";
import { creerIncident, listerIncidents, recupererIncident } from "../controleurs/incident.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.get("/", authentifier, listerIncidents);
router.get("/:id", authentifier, recupererIncident);
router.post("/", authentifier, autoriser("Citoyens", "Administrateurs"), creerIncident);

export default router;
