import { Router } from "express";
import { creerVilain, listeVilains } from "../controleurs/vilains.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.get("/", listeVilains);
router.post("/", authentifier, autoriser("Administrateurs"), creerVilain);

export default router;
