import { Router } from "express";
import { statistiques, statistiquesGlobales } from "../controleurs/stats.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.get("/", statistiques);
router.get("/globales", authentifier, autoriser("SuperHeros"), statistiquesGlobales);

export default router;
