import { Router } from "express";
import { sInscrire, seDesinscrire } from "../controleurs/newsletter.controleur";
import { limiteurSensible } from "../middlewares/limiteurs";

const router = Router();

router.post("/", limiteurSensible, sInscrire);
router.delete("/", seDesinscrire);

export default router;
