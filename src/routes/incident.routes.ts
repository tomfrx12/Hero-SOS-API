import { Router } from "express";
import { creerIncident, intervenir, listerIncidents, recupererIncident } from "../controleurs/incident.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.get("/", authentifier, listerIncidents);
router.get("/:id", authentifier, recupererIncident);
router.post("/", authentifier, autoriser("Citoyens", "Administrateurs"), creerIncident);
router.post("/:id/intervention", authentifier, autoriser("SuperHeros"), intervenir);

export default router;
