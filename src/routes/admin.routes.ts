import { Router } from "express";
import { changerVisibiliteAvis, detailIncident, detailUtilisateur, envoyerNewsletter, listerAvis, listerUtilisateurs, modifierUtilisateur, tableauDeBord } from "../controleurs/admin.controleur";
import { creerArticle, detailArticleAdmin, listerArticlesAdmin, modifierArticle, supprimerArticle } from "../controleurs/articles.controleur";
import { listerFilmsAdmin, validerFilm, refuserFilm } from "../controleurs/videotheque.controleur";
import { authentifier, autoriser } from "../middlewares/authentifier";
import { uploadPhoto } from "../services/upload";

const router = Router();

router.use(authentifier, autoriser("Administrateurs"));

router.get("/tableau-de-bord", tableauDeBord);
router.get("/utilisateurs", listerUtilisateurs);
router.get("/utilisateurs/:id", detailUtilisateur);
router.patch("/utilisateurs/:id", modifierUtilisateur);
router.get("/incidents/:id", detailIncident);
router.get("/avis", listerAvis);
router.patch("/avis/:id", changerVisibiliteAvis);
router.post("/newsletter/envoyer", envoyerNewsletter);

router.get("/articles", listerArticlesAdmin);
router.get("/articles/:id", detailArticleAdmin);
router.post("/articles", uploadPhoto.single("image"), creerArticle);
router.patch("/articles/:id", uploadPhoto.single("image"), modifierArticle);
router.delete("/articles/:id", supprimerArticle);

router.get("/videotheque", listerFilmsAdmin);
router.patch("/videotheque/:id/valider", validerFilm);
router.patch("/videotheque/:id/refuser", refuserFilm);

export default router;
