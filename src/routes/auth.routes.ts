import { Router } from "express";
import { connexion, inscription, inscriptionRapide, me, motDePasseOublie, reinitialiserMotDePasse } from "../controleurs/auth.controleur";
import { authentifier } from "../middlewares/authentifier";

const router = Router();

router.post("/inscription", inscription);
router.post("/inscription-rapide", inscriptionRapide);
router.post("/connexion", connexion);
router.get("/me", authentifier, me);
router.post("/mot-de-passe-oublie", motDePasseOublie);
router.post("/reinitialiser-mot-de-passe", reinitialiserMotDePasse);

export default router;
