import { supabaseAdmin } from "../config/supabase.js";

function validarTipoAtendimento(tipo) {
  const tiposValidos = ["PARTICULAR", "MASTER", "SUS"];

  if (!tipo) return "PARTICULAR";

  const tipoFormatado = String(tipo).trim().toUpperCase();

  if (!tiposValidos.includes(tipoFormatado)) {
    const err = new Error("Tipo de atendimento inválido.");
    err.statusCode = 400;
    throw err;
  }

  return tipoFormatado;
}

function validarStatusPagamento(status, tipoAtendimento) {
  if (tipoAtendimento === "SUS") {
    return "pendente";
  }

  const statusNormalizado = String(status || "pendente").trim().toLowerCase();

  if (!["pago", "pendente"].includes(statusNormalizado)) {
    const err = new Error("Status de pagamento inválido.");
    err.statusCode = 400;
    throw err;
  }

  return statusNormalizado;
}

function normalizarHora(hora) {
  if (!hora) return null;
  return String(hora).trim();
}

function normalizarTexto(texto) {
  return texto?.trim() || null;
}

export async function criarConsultaService(payload, usuario) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const paciente_id = payload.paciente_id;
  const data_consulta = payload.data_consulta;
  const hora_consulta = normalizarHora(payload.hora_consulta);
  const tipo_atendimento = validarTipoAtendimento(payload.tipo_atendimento);
  const status_pagamento = validarStatusPagamento(
    payload.status_pagamento,
    tipo_atendimento
  );
  const observacoes = normalizarTexto(payload.observacoes);

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

  const { data: pacienteExiste, error: erroPaciente } = await supabaseAdmin
    .from("pacientes")
    .select("id")
    .eq("id", paciente_id)
    .maybeSingle();

  if (erroPaciente) {
    console.error("ERRO AO VALIDAR PACIENTE:", erroPaciente);
    throw new Error("Erro ao validar paciente.");
  }

  if (!pacienteExiste) {
    const err = new Error("Paciente não encontrado.");
    err.statusCode = 404;
    throw err;
  }

  const payloadInsert = {
    paciente_id,
    data_consulta,
    hora_consulta,
    tipo_atendimento,
    status_pagamento,
    observacoes,
    criado_por: usuario?.id || null,
  };

  console.log("PAYLOAD INSERT CONSULTA:", payloadInsert);

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .insert(payloadInsert)
    .select(
      `
      *,
      paciente:pacientes (
        id,
        nome,
        cpf,
        telefone
      )
    `
    )
    .single();

  if (error) {
    console.error("ERRO SUPABASE AO CRIAR CONSULTA:");
    console.error(error);
    throw new Error(`Erro ao criar consulta: ${error.message}`);
  }

  return data;
}

export async function listarConsultasService(filtros = {}) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  let query = supabaseAdmin
    .from("consultas")
    .select(
      `
      *,
      paciente:pacientes (
        id,
        nome,
        cpf,
        telefone
      )
    `
    )
    .order("data_consulta", { ascending: true })
    .order("hora_consulta", { ascending: true });

  if (filtros.data) {
    query = query.eq("data_consulta", filtros.data);
  }

  if (filtros.paciente_id) {
    query = query.eq("paciente_id", filtros.paciente_id);
  }

  if (filtros.tipo_atendimento) {
    query = query.eq(
      "tipo_atendimento",
      String(filtros.tipo_atendimento).trim().toUpperCase()
    );
  }

  if (filtros.status_pagamento) {
    query = query.eq(
      "status_pagamento",
      String(filtros.status_pagamento).trim().toLowerCase()
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro Supabase ao listar consultas:", error);
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
    .select(
      `
      *,
      paciente:pacientes (
        id,
        nome,
        cpf,
        telefone
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro Supabase ao buscar consulta:", error);
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

  const mesNumero = Number(mes);
  const anoNumero = Number(ano);

  if (!mesNumero || !anoNumero) {
    const err = new Error("Mês e ano são obrigatórios.");
    err.statusCode = 400;
    throw err;
  }

  const primeiroDia = `${anoNumero}-${String(mesNumero).padStart(2, "0")}-01`;
  const ultimoDiaDate = new Date(anoNumero, mesNumero, 0);
  const ultimoDia = `${anoNumero}-${String(mesNumero).padStart(2, "0")}-${String(
    ultimoDiaDate.getDate()
  ).padStart(2, "0")}`;

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .select("data_consulta, status_pagamento, tipo_atendimento")
    .gte("data_consulta", primeiroDia)
    .lte("data_consulta", ultimoDia)
    .order("data_consulta", { ascending: true });

  if (error) {
    console.error("Erro Supabase ao gerar resumo calendário:", error);
    throw new Error("Erro ao gerar resumo do calendário.");
  }

  const mapa = new Map();

  for (const item of data) {
    const dataConsulta = item.data_consulta;

    if (!mapa.has(dataConsulta)) {
      mapa.set(dataConsulta, {
        data: dataConsulta,
        total: 0,
        pagas: 0,
        pendentes: 0,
      });
    }

    const registro = mapa.get(dataConsulta);
    registro.total += 1;

    if (item.tipo_atendimento !== "SUS") {
      if (item.status_pagamento === "pago") {
        registro.pagas += 1;
      } else if (item.status_pagamento === "pendente") {
        registro.pendentes += 1;
      }
    }
  }

  return Array.from(mapa.values());
}

export async function atualizarConsultaService(id, payload) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const consultaAtual = await buscarConsultaPorIdService(id);

  const data_consulta = payload.data_consulta || consultaAtual.data_consulta;
  const hora_consulta =
    payload.hora_consulta !== undefined
      ? normalizarHora(payload.hora_consulta)
      : consultaAtual.hora_consulta;

  const tipo_atendimento =
    payload.tipo_atendimento !== undefined
      ? validarTipoAtendimento(payload.tipo_atendimento)
      : validarTipoAtendimento(consultaAtual.tipo_atendimento);

  let status_pagamento;

  if (payload.status_pagamento !== undefined) {
    status_pagamento = validarStatusPagamento(
      payload.status_pagamento,
      tipo_atendimento
    );
  } else {
    status_pagamento =
      tipo_atendimento === "SUS"
        ? "pendente"
        : validarStatusPagamento(
            consultaAtual.status_pagamento,
            tipo_atendimento
          );
  }

  const observacoes =
    payload.observacoes !== undefined
      ? normalizarTexto(payload.observacoes)
      : consultaAtual.observacoes;

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .update({
      data_consulta,
      hora_consulta,
      tipo_atendimento,
      status_pagamento,
      observacoes,
    })
    .eq("id", id)
    .select(
      `
      *,
      paciente:pacientes (
        id,
        nome,
        cpf,
        telefone
      )
    `
    )
    .single();

  if (error) {
    console.error("Erro Supabase ao atualizar consulta:", error);
    throw new Error("Erro ao atualizar consulta.");
  }

  return data;
}

export async function atualizarPagamentoService(id, statusPagamento) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const consultaAtual = await buscarConsultaPorIdService(id);

  if (consultaAtual.tipo_atendimento === "SUS") {
    const err = new Error("Consultas SUS não possuem controle de pagamento.");
    err.statusCode = 400;
    throw err;
  }

  const status_pagamento = validarStatusPagamento(
    statusPagamento,
    consultaAtual.tipo_atendimento
  );

  const { data, error } = await supabaseAdmin
    .from("consultas")
    .update({
      status_pagamento,
    })
    .eq("id", id)
    .select(
      `
      *,
      paciente:pacientes (
        id,
        nome,
        cpf,
        telefone
      )
    `
    )
    .single();

  if (error) {
    console.error("Erro Supabase ao atualizar pagamento:", error);
    throw new Error("Erro ao atualizar pagamento.");
  }

  return data;
}

export async function deletarConsultaService(id) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  await buscarConsultaPorIdService(id);

  const { error } = await supabaseAdmin
    .from("consultas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro Supabase ao deletar consulta:", error);
    throw new Error("Erro ao remover consulta.");
  }

  return true;
}