import {
  criarPacienteService,
  listarPacientesService,
  buscarPacientePorIdService,
  atualizarPacienteService,
} from "../services/pacientesService.js";

export async function criarPaciente(req, res, next) {
  try {
    const paciente = await criarPacienteService(req.body);

    return res.status(201).json({
      mensagem: "Paciente cadastrado com sucesso.",
      paciente,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listarPacientes(req, res, next) {
  try {
    const { busca } = req.query;

    const pacientes = await listarPacientesService(busca);

    return res.status(200).json({
      pacientes,
    });
  } catch (error) {
    return next(error);
  }
}

export async function buscarPacientePorId(req, res, next) {
  try {
    const paciente = await buscarPacientePorIdService(req.params.id);

    return res.status(200).json({
      paciente,
    });
  } catch (error) {
    return next(error);
  }
}

export async function atualizarPaciente(req, res, next) {
  try {
    const paciente = await atualizarPacienteService(req.params.id, req.body);

    return res.status(200).json({
      mensagem: "Paciente atualizado com sucesso.",
      paciente,
    });
  } catch (error) {
    return next(error);
  }
}