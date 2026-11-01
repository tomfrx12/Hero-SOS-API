import { Router } from "express";
import { creerVilain, listeVilains, detailVilain, modifierVilain, supprimerVilain } from "../controleurs/vilains.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.get("/", listeVilains);
router.get("/:id", detailVilain);
router.post("/", authentifier, autoriser("SuperHeros", "Administrateurs"), creerVilain);
router.put("/:id", authentifier, autoriser("SuperHeros", "Administrateurs"), modifierVilain);
router.delete("/:id", authentifier, autoriser("SuperHeros", "Administrateurs"), supprimerVilain);

export default router;
