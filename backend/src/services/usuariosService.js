import { supabaseAdmin } from "../config/supabase.js";
import { hashPassword } from "../utils/hash.js";
import { isValidEmail } from "../utils/validators.js";

async function buscarUsuarioPorId(id) {
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email, perfil, ativo, criado_em")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao buscar usuário.");
  }

  if (!data) {
    const err = new Error("Usuário não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  return data;
}

export async function criarUsuarioService(payload) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const nome = payload.nome?.trim();
  const email = payload.email?.trim().toLowerCase();
  const senha = payload.senha;
  const perfil = payload.perfil;
  const ativo = payload.ativo ?? true;

  if (!nome) {
    const err = new Error("Nome é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!email || !isValidEmail(email)) {
    const err = new Error("E-mail inválido.");
    err.statusCode = 400;
    throw err;
  }

  if (!senha || senha.length < 6) {
    const err = new Error("A senha deve ter pelo menos 6 caracteres.");
    err.statusCode = 400;
    throw err;
  }

  if (!["admin", "funcionario"].includes(perfil)) {
    const err = new Error("Perfil inválido.");
    err.statusCode = 400;
    throw err;
  }

  const { data: existente } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existente) {
    const err = new Error("Já existe um usuário com esse e-mail.");
    err.statusCode = 409;
    throw err;
  }

  const senha_hash = await hashPassword(senha);

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .insert({
      nome,
      email,
      senha_hash,
      perfil,
      ativo,
    })
    .select("id, nome, email, perfil, ativo, criado_em")
    .single();

  if (error) {
    throw new Error("Erro ao criar usuário.");
  }

  return data;
}

export async function listarUsuariosService() {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email, perfil, ativo, criado_em")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Erro ao listar usuários.");
  }

  return data;
}

export async function atualizarUsuarioService(id, payload) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const atual = await buscarUsuarioPorId(id);

  const nome = payload.nome?.trim() || atual.nome;
  const email = payload.email ? payload.email.trim().toLowerCase() : atual.email;
  const perfil = payload.perfil || atual.perfil;

  if (!nome) {
    const err = new Error("Nome é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!email || !isValidEmail(email)) {
    const err = new Error("E-mail inválido.");
    err.statusCode = 400;
    throw err;
  }

  if (!["admin", "funcionario"].includes(perfil)) {
    const err = new Error("Perfil inválido.");
    err.statusCode = 400;
    throw err;
  }

  const { data: existente } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .neq("id", id)
    .maybeSingle();

  if (existente) {
    const err = new Error("Já existe outro usuário com esse e-mail.");
    err.statusCode = 409;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .update({
      nome,
      email,
      perfil,
    })
    .eq("id", id)
    .select("id, nome, email, perfil, ativo, criado_em")
    .single();

  if (error) {
    throw new Error("Erro ao atualizar usuário.");
  }

  return data;
}

export async function atualizarStatusUsuarioService(id, ativo, usuarioLogado) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  if (typeof ativo !== "boolean") {
    const err = new Error("O campo ativo deve ser true ou false.");
    err.statusCode = 400;
    throw err;
  }

  // ❌ impedir admin de se desativar
  if (usuarioLogado.id === id && ativo === false) {
    const err = new Error("Você não pode desativar seu próprio usuário.");
    err.statusCode = 400;
    throw err;
  }

  const usuario = await buscarUsuarioPorId(id);

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .update({ ativo })
    .eq("id", id)
    .select("id, nome, email, perfil, ativo, criado_em")
    .single();

  if (error) {
    throw new Error("Erro ao atualizar status do usuário.");
  }

  return data;
}

export async function buscarUsuarioPorIdService(id) {
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email, perfil, ativo, criado_em")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao buscar usuário.");
  }

  if (!data) {
    const err = new Error("Usuário não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  return data;
}
export async function buscarConsultaPorIdService(id) {
  const { data, error } = await supabaseAdmin
    .from("consultas")
    .select(`
      id,
      data_consulta,
      hora_consulta,
      status_pagamento,
      observacoes,
      criado_em,
      paciente:pacientes (
        id,
        nome,
        cpf,
        telefone
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao buscar consulta.");
  }

  if (!data) {
    const err = new Error("Consulta não encontrada.");
    err.statusCode = 404;
    throw err;
  }

  return data;
}