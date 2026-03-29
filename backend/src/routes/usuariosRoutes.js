import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import { buscarUsuarioPorId } from "../controllers/usuariosController.js";
import {
  criarUsuario,
  listarUsuarios,
  atualizarUsuario,
  atualizarStatusUsuario,
} from "../controllers/usuariosController.js";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.post("/", criarUsuario);
router.get("/", listarUsuarios);
router.put("/:id", atualizarUsuario);
router.patch("/:id/status", atualizarStatusUsuario);
router.get("/:id", buscarUsuarioPorId);

export default router;