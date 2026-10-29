import { Router } from "express";
import { creerIncident } from "../controleurs/incident.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.post("/", authentifier, autoriser("Citoyens", "Administrateurs"), creerIncident);

export default router;
