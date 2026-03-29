import { loginUsuario } from "../services/authService.js";

export async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios.",
      });
    }

    const resultado = await loginUsuario(email, senha);

    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  return res.status(200).json({
    usuario: req.usuario,
  });
}