import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  criarPaciente,
  listarPacientes,
  buscarPacientePorId,
  atualizarPaciente,
} from "../controllers/pacientesController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", criarPaciente);
router.get("/", listarPacientes);
router.get("/:id", buscarPacientePorId);
router.put("/:id", atualizarPaciente);

export default router;