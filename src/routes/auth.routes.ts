import { Router } from "express";
import { connexion, inscription, me } from "../controleurs/auth.controleur";
import { authentifier } from "../middlewares/authentifier";

const router = Router();

router.post("/inscription", inscription);
router.post("/connexion", connexion);
router.get("/me", authentifier, me);

export default router;
