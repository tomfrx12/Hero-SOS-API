import { Router } from "express";
import { creerVilain, listeVilains, detailVilain, modifierVilain, supprimerVilain, uploadPhotoVilain } from "../controleurs/vilains.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";
import { uploadPhoto } from "../services/upload";

const router = Router();

router.get("/", listeVilains);
router.get("/:id", detailVilain);
router.post("/", authentifier, autoriser("SuperHeros", "Administrateurs"), creerVilain);
router.put("/:id", authentifier, autoriser("SuperHeros", "Administrateurs"), modifierVilain);
router.delete("/:id", authentifier, autoriser("SuperHeros", "Administrateurs"), supprimerVilain);
router.post("/:id/photo", authentifier, autoriser("SuperHeros", "Administrateurs"), uploadPhoto.single("photo"), uploadPhotoVilain);

export default router;
