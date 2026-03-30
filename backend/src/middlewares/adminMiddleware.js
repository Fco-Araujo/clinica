export function adminMiddleware(req, res, next) {
  if (!req.usuario || req.usuario.perfil !== "admin") {
    return res.status(403).json({
      erro: "Acesso negado. Apenas administradores podem realizar esta ação.",
    });
  }

  next();
}