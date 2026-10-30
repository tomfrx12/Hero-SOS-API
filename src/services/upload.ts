import multer from "multer";
import path from "path";

const stockage = multer.diskStorage({
  destination: "uploads",
  filename: (_req, fichier, rappel) => {
    rappel(null, Date.now() + path.extname(fichier.originalname));
  },
});

export const uploadPhoto = multer({
  storage: stockage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
  fileFilter: (_req, fichier, rappel) => {
    rappel(null, fichier.mimetype.startsWith("image/"));
  },
});
