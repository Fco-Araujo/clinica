import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { deletarConsulta } from "../controllers/consultasController.js";
import {
  criarConsulta,
  listarConsultas,
  resumoCalendario,
  atualizarConsulta,
  atualizarPagamento,
} from "../controllers/consultasController.js";

const router = Router();

router.use(authMiddleware);

router.post("/", criarConsulta);
router.get("/", listarConsultas);
router.get("/calendario/resumo", resumoCalendario);
router.put("/:id", atualizarConsulta);
router.patch("/:id/pagamento", atualizarPagamento);
router.delete("/:id", deletarConsulta);


export default router;