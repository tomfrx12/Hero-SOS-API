import dotenv from "dotenv";
dotenv.config();
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import multer from "multer";
import authRoutes from "./routes/auth.routes";
import incidentRoutes from "./routes/incident.routes";
import herosRoutes from "./routes/heros.routes";
import statsRoutes from "./routes/stats.routes";
import moiRoutes from "./routes/moi.routes";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/incidents", incidentRoutes);
app.use("/heros", herosRoutes);
app.use("/stats", statsRoutes);
app.use("/moi", moiRoutes);

app.use((erreur: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (erreur instanceof multer.MulterError) {
    res.status(400).json({ message: "Choisis une image (2 Mo maximum)" });
    return;
  }
  console.error(erreur);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
