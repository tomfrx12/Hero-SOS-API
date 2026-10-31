import { Router } from "express";
import { changerVisibiliteAvis, detailIncident, detailUtilisateur, listerAvis, listerUtilisateurs, modifierUtilisateur, tableauDeBord } from "../controleurs/admin.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";

const router = Router();

router.use(authentifier, autoriser("Administrateurs"));

router.get("/tableau-de-bord", tableauDeBord);
router.get("/utilisateurs", listerUtilisateurs);
router.get("/utilisateurs/:id", detailUtilisateur);
router.patch("/utilisateurs/:id", modifierUtilisateur);
router.get("/incidents/:id", detailIncident);
router.get("/avis", listerAvis);
router.patch("/avis/:id", changerVisibiliteAvis);

export default router;
