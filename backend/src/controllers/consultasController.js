import {
  criarConsultaService,
  listarConsultasService,
  buscarConsultaPorIdService,
  resumoCalendarioService,
  atualizarConsultaService,
  atualizarPagamentoService,
  deletarConsultaService,
} from "../services/consultasService.js";

export async function criarConsulta(req, res, next) {
  try {
    const consulta = await criarConsultaService(req.body, req.usuario);

    return res.status(201).json({
      mensagem: "Consulta criada com sucesso.",
      consulta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listarConsultas(req, res, next) {
  try {
    const filtros = {
      data: req.query.data,
      paciente_id: req.query.paciente_id,
      status_pagamento: req.query.status_pagamento,
    };

    const consultas = await listarConsultasService(filtros);

    return res.status(200).json({
      consultas,
    });
  } catch (error) {
    return next(error);
  }
}

export async function buscarConsultaPorId(req, res, next) {
  try {
    const consulta = await buscarConsultaPorIdService(req.params.id);

    return res.status(200).json({
      consulta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function resumoCalendario(req, res, next) {
  try {
    const { mes, ano } = req.query;

    const resumo = await resumoCalendarioService({ mes, ano });

    return res.status(200).json({
      resumo,
    });
  } catch (error) {
    return next(error);
  }
}

export async function atualizarConsulta(req, res, next) {
  try {
    const consulta = await atualizarConsultaService(req.params.id, req.body);

    return res.status(200).json({
      mensagem: "Consulta atualizada com sucesso.",
      consulta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function atualizarPagamento(req, res, next) {
  try {
    const consulta = await atualizarPagamentoService(
      req.params.id,
      req.body.status_pagamento
    );

    return res.status(200).json({
      mensagem: "Pagamento atualizado com sucesso.",
      consulta,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deletarConsulta(req, res, next) {
  try {
    await deletarConsultaService(req.params.id);

    return res.status(200).json({
      mensagem: "Consulta removida com sucesso.",
    });
  } catch (error) {
    return next(error);
  }
}