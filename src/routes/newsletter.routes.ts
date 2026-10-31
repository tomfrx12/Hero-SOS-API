import { Router } from "express";
import { sInscrire, seDesinscrire } from "../controleurs/newsletter.controleur";

const router = Router();

router.post("/", sInscrire);
router.delete("/", seDesinscrire);

export default router;
