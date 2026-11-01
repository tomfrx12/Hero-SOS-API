import { Router } from "express";
import { detailArticle, listerArticles } from "../controleurs/articles.controleur";

const router = Router();

router.get("/", listerArticles);
router.get("/:id", detailArticle);

export default router;
