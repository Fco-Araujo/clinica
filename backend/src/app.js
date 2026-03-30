import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import usuariosRoutes from "./routes/usuariosRoutes.js";
import pacientesRoutes from "./routes/pacientesRoutes.js";
import consultasRoutes from "./routes/consultasRoutes.js";
import { notFoundMiddleware } from "./middlewares/notFoundMiddleware.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(morgan("dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    erro: "Muitas tentativas. Tente novamente em alguns minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    mensagem: "API da Clínica MassoFisio funcionando.",
  });
});

app.use("/auth", authLimiter, authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/pacientes", pacientesRoutes);
app.use("/consultas", consultasRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;