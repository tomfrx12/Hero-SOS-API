import { Router } from "express";
import { connexion, inscription, inscriptionRapide, me, motDePasseOublie, reinitialiserMotDePasse } from "../controleurs/auth.controleur";
import { authentifier } from "../middlewares/authentifier";
import { limiteurSensible } from "../middlewares/limiteurs";

const router = Router();

router.post("/inscription", limiteurSensible, inscription);
router.post("/inscription-rapide", limiteurSensible, inscriptionRapide);
router.post("/connexion", limiteurSensible, connexion);
router.get("/me", authentifier, me);
router.post("/mot-de-passe-oublie", limiteurSensible, motDePasseOublie);
router.post("/reinitialiser-mot-de-passe", limiteurSensible, reinitialiserMotDePasse);

export default router;
