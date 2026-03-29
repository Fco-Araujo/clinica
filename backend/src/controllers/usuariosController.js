import {
  criarUsuarioService,
  listarUsuariosService,
  atualizarUsuarioService,
  atualizarStatusUsuarioService,
} from "../services/usuariosService.js";

export async function criarUsuario(req, res, next) {
  try {
    const usuario = await criarUsuarioService(req.body);

    return res.status(201).json({
      mensagem: "Usuário criado com sucesso.",
      usuario,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await listarUsuariosService();

    return res.status(200).json({
      usuarios,
    });
  } catch (error) {
    return next(error);
  }
}

export async function atualizarUsuario(req, res, next) {
  try {
    const usuario = await atualizarUsuarioService(req.params.id, req.body);

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso.",
      usuario,
    });
  } catch (error) {
    return next(error);
  }
}

export async function atualizarStatusUsuario(req, res, next) {
  try {
    const usuario = await atualizarStatusUsuarioService(req.params.id, req.body.ativo);

    return res.status(200).json({
      mensagem: "Status do usuário atualizado com sucesso.",
      usuario,
    });
  } catch (error) {
    return next(error);
  }
}