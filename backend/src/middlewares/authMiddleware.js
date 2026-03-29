import { verifyToken } from "../utils/jwt.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      erro: "Token não enviado.",
    });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      erro: "Formato do token inválido.",
    });
  }

  try {
    const decoded = verifyToken(token);

    req.usuario = decoded;
    return next();
  } catch {
    return res.status(401).json({
      erro: "Token inválido ou expirado.",
    });
  }
}