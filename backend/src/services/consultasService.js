import { supabaseAdmin } from "../config/supabase.js";

async function verificarPacienteExiste(pacienteId) {
  const { data, error } = await supabaseAdmin
    .from("pacientes")
    .select("id")
    .eq("id", pacienteId)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao verificar paciente.");
  }

  return !!data;
}

async function buscarConsultaInternaPorId(id) {
  const { data, error } = await supabaseAdmin
    .from("consultas")
    .select(`
      id,
      paciente_id,
      data_consulta,
      hora_consulta,
      status_pagamento,
      observacoes,
      criado_por,
      criado_em
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

function validarData(data) {
  return /^\d{4}-\d{2}-\d{2}$/.test(data);
}

function validarHora(hora) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(hora);
}

export async function criarConsultaService(payload, usuario) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const paciente_id = payload.paciente_id;
  const data_consulta = payload.data_consulta;
  const hora_consulta = payload.hora_consulta || null;
  const status_pagamento = payload.status_pagamento || "pendente";
  const observacoes = payload.observacoes?.trim() || null;

  if (!paciente_id) {
    const err = new Error("Paciente é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!data_consulta) {
    const err = new Error("Data da consulta é obrigatória.");
    err.statusCode = 400;
    throw err;
  }

  if (!validarData(data_consulta)) {
    const err = new Error("Data inválida. Use o formato YYYY-MM-DD.");
    err.statusCode = 400;
    throw err;
  }

  if (hora_consulta && !validarHora(hora_consulta)) {
    const err = new Error("Hora inválida. Use o formato HH:mm ou HH:mm:ss.");
    err.statusCode = 400;
    throw err;
  }

  if (!["pago", "pendente"].includes(status_pagamento)) {
    const err = new Error("Status de pagamento inválido.");
    err.statusCode = 400;
    throw err;
  }

  const pacienteExiste = await verificarPacienteExiste(paciente_id);

  if (!pacienteExiste) {
    const err = new Error("Paciente não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .insert({
      paciente_id,
      data_consulta,
      hora_consulta,
      status_pagamento,
      observacoes,
      criado_por: usuario.id,
    })
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
    .single();

  if (error) {
    throw new Error("Erro ao criar consulta.");
  }

  return data;
}

export async function listarConsultasService(filtros = {}) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  let query = supabaseAdmin
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
    .order("data_consulta", { ascending: true })
    .order("hora_consulta", { ascending: true });

  if (filtros.data) {
    query = query.eq("data_consulta", filtros.data);
  }

  if (filtros.paciente_id) {
    query = query.eq("paciente_id", filtros.paciente_id);
  }

  if (filtros.status_pagamento) {
    query = query.eq("status_pagamento", filtros.status_pagamento);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Erro ao listar consultas.");
  }

  return data;
}

export async function buscarConsultaPorIdService(id) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

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

export async function resumoCalendarioService({ mes, ano }) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  if (!mes || !ano) {
    const err = new Error("Mês e ano são obrigatórios.");
    err.statusCode = 400;
    throw err;
  }

  const mesNumero = String(mes).padStart(2, "0");
  const inicio = `${ano}-${mesNumero}-01`;
  const fim = new Date(Number(ano), Number(mes), 0).toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .select("data_consulta, status_pagamento")
    .gte("data_consulta", inicio)
    .lte("data_consulta", fim)
    .order("data_consulta", { ascending: true });

  if (error) {
    throw new Error("Erro ao gerar resumo do calendário.");
  }

  const mapa = {};

  for (const item of data) {
    if (!mapa[item.data_consulta]) {
      mapa[item.data_consulta] = {
        data: item.data_consulta,
        total: 0,
        pagas: 0,
        pendentes: 0,
      };
    }

    mapa[item.data_consulta].total += 1;

    if (item.status_pagamento === "pago") {
      mapa[item.data_consulta].pagas += 1;
    } else {
      mapa[item.data_consulta].pendentes += 1;
    }
  }

  return Object.values(mapa);
}

export async function atualizarConsultaService(id, payload) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const consultaAtual = await buscarConsultaInternaPorId(id);

  const data_consulta = payload.data_consulta || consultaAtual.data_consulta;
  const hora_consulta =
    payload.hora_consulta !== undefined
      ? payload.hora_consulta || null
      : consultaAtual.hora_consulta;
  const observacoes =
    payload.observacoes !== undefined
      ? payload.observacoes?.trim() || null
      : consultaAtual.observacoes;

  if (!validarData(data_consulta)) {
    const err = new Error("Data inválida. Use o formato YYYY-MM-DD.");
    err.statusCode = 400;
    throw err;
  }

  if (hora_consulta && !validarHora(hora_consulta)) {
    const err = new Error("Hora inválida. Use o formato HH:mm ou HH:mm:ss.");
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .update({
      data_consulta,
      hora_consulta,
      observacoes,
    })
    .eq("id", id)
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
    .single();

  if (error) {
    throw new Error("Erro ao atualizar consulta.");
  }

  return data;
}

export async function atualizarPagamentoService(id, status_pagamento) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  if (!status_pagamento) {
    const err = new Error("Status de pagamento é obrigatório.");
    err.statusCode = 400;
    throw err;
  }

  if (!["pago", "pendente"].includes(status_pagamento)) {
    const err = new Error("Status de pagamento inválido.");
    err.statusCode = 400;
    throw err;
  }

  await buscarConsultaInternaPorId(id);

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .update({ status_pagamento })
    .eq("id", id)
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
    .single();

  if (error) {
    throw new Error("Erro ao atualizar pagamento.");
  }

  return data;
}

export async function deletarConsultaService(id) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const { data: existente, error: erroBusca } = await supabaseAdmin
    .from("consultas")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (erroBusca) {
    throw new Error("Erro ao buscar consulta para remoção.");
  }

  if (!existente) {
    const err = new Error("Consulta não encontrada.");
    err.statusCode = 404;
    throw err;
  }

  const { error } = await supabaseAdmin
    .from("consultas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error("Erro ao remover consulta.");
  }
}