import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  criarPaciente,
  listarPacientes,
  buscarPacientePorId,
  atualizarPaciente,
  deletarPaciente,
} from "../controllers/pacientesController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", criarPaciente);
router.get("/", listarPacientes);
router.get("/:id", buscarPacientePorId);

router.put("/:id", adminMiddleware, atualizarPaciente);
router.delete("/:id", adminMiddleware, deletarPaciente);

export default router;