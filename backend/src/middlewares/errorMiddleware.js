export function errorMiddleware(error, req, res, next) {
  console.error(error);

  return res.status(error.statusCode || 500).json({
    erro: error.message || "Erro interno do servidor.",
  });
}