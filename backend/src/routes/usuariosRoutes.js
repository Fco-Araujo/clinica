import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  return res.status(501).json({
    mensagem: "Rotas de usuários ainda serão implementadas.",
  });
});

export default router;