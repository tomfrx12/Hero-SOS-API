import { Router } from "express";
import { authentifier, autoriser } from "../middlewares/authentifier";
import {
  listerFilmsPublics,
  rechercherFilm,
  mesFilms,
  ajouterFilm,
  retirerFilm,
} from "../controleurs/videotheque.controleur";

const router = Router();

// Public
router.get("/", listerFilmsPublics);

// Super-héros
router.get("/recherche", authentifier, autoriser("SuperHeros"), rechercherFilm);
router.get("/mes-films", authentifier, autoriser("SuperHeros"), mesFilms);
router.post("/", authentifier, autoriser("SuperHeros"), ajouterFilm);
router.delete("/:filmId", authentifier, autoriser("SuperHeros"), retirerFilm);

export default router;
