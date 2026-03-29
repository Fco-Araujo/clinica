export function notFoundMiddleware(req, res, next) {
  return res.status(404).json({
    erro: "Rota não encontrada.",
  });
}