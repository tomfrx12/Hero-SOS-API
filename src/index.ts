import dotenv from "dotenv";
dotenv.config();
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import incidentRoutes from "./routes/incident.routes";
import herosRoutes from "./routes/heros.routes";
import vilainsRoutes from "./routes/vilains.routes";
import statsRoutes from "./routes/stats.routes";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/incidents", incidentRoutes);
app.use("/heros", herosRoutes);
app.use("/vilains", vilainsRoutes);
app.use("/stats", statsRoutes);

app.use((erreur: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erreur);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
