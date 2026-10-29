import { Router } from "express";
import { statistiques } from "../controleurs/stats.controleur";

const router = Router();

router.get("/", statistiques);

export default router;
