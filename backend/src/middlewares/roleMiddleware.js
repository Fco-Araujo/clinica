export function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        erro: "Usuário não autenticado.",
      });
    }

    if (!rolesPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        erro: "Acesso negado.",
      });
    }

    return next();
  };
}