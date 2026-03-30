import { supabaseAdmin } from "../config/supabase.js";
import { isValidCPF, onlyNumbers } from "../utils/validators.js";

export async function criarPacienteService(payload) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const nome = payload.nome?.trim();
  const cpf = onlyNumbers(payload.cpf);
  const telefone = payload.telefone?.trim() || null;
  const observacoes = payload.observacoes?.trim() || null;

  if (!nome) {
    const err = new Error("Nome é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!cpf) {
    const err = new Error("CPF é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!isValidCPF(cpf)) {
    const err = new Error("CPF inválido.");
    err.statusCode = 400;
    throw err;
  }

  const { data: existente } = await supabaseAdmin
    .from("pacientes")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();

  if (existente) {
    const err = new Error("Já existe um paciente com esse CPF.");
    err.statusCode = 409;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("pacientes")
    .insert({
      nome,
      cpf,
      telefone,
      observacoes,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Erro ao cadastrar paciente.");
  }

  return data;
}

export async function listarPacientesService(busca) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  let query = supabaseAdmin
    .from("pacientes")
    .select("*")
    .order("nome", { ascending: true });

  if (busca?.trim()) {
    query = query.ilike("nome", `%${busca.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Erro ao listar pacientes.");
  }

  return data;
}

export async function buscarPacientePorIdService(id) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const { data, error } = await supabaseAdmin
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao buscar paciente.");
  }

  if (!data) {
    const err = new Error("Paciente não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  return data;
}

export async function atualizarPacienteService(id, payload) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const pacienteAtual = await buscarPacientePorIdService(id);

  const nome = payload.nome?.trim() || pacienteAtual.nome;
  const cpf = payload.cpf ? onlyNumbers(payload.cpf) : pacienteAtual.cpf;
  const telefone =
    payload.telefone !== undefined
      ? payload.telefone?.trim() || null
      : pacienteAtual.telefone;
  const observacoes =
    payload.observacoes !== undefined
      ? payload.observacoes?.trim() || null
      : pacienteAtual.observacoes;

  if (!nome) {
    const err = new Error("Nome é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!cpf || !isValidCPF(cpf)) {
    const err = new Error("CPF inválido.");
    err.statusCode = 400;
    throw err;
  }

  const { data: cpfExistente } = await supabaseAdmin
    .from("pacientes")
    .select("id")
    .eq("cpf", cpf)
    .neq("id", id)
    .maybeSingle();

  if (cpfExistente) {
    const err = new Error("Já existe outro paciente com esse CPF.");
    err.statusCode = 409;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("pacientes")
    .update({
      nome,
      cpf,
      telefone,
      observacoes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("Erro ao atualizar paciente.");
  }

  return data;
}

export async function deletarPacienteService(id) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  await buscarPacientePorIdService(id);

  const { error: erroConsultas } = await supabaseAdmin
    .from("consultas")
    .delete()
    .eq("paciente_id", id);

  if (erroConsultas) {
    throw new Error("Erro ao remover consultas vinculadas ao paciente.");
  }

  const { error } = await supabaseAdmin
    .from("pacientes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Erro ao remover paciente.");
  }

  return true;
}