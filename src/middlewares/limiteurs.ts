import rateLimit from "express-rate-limit";

const quinzeMinutes = 15 * 60 * 1000;

export const limiteurGeneral = rateLimit({
  windowMs: quinzeMinutes,
  limit: 500,
  message: { message: "Trop de requêtes, réessaie dans quelques minutes" },
});

export const limiteurSensible = rateLimit({
  windowMs: quinzeMinutes,
  limit: 20,
  message: { message: "Trop de tentatives, réessaie dans 15 minutes" },
});
