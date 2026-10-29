import { Router } from "express";
import { listeHeros } from "../controleurs/heros.controleur";

const router = Router();

router.get("/", listeHeros);

export default router;
