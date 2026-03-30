const API_URL = "https://friendly-spork-g4r4rw4wqq6phvx54-3000.app.github.dev";

const token = localStorage.getItem("token");
const usuarioSalvo = localStorage.getItem("usuario");

if (!token || !usuarioSalvo) {
  window.location.href = "../index.html";
}

let usuario = null;

try {
  usuario = JSON.parse(usuarioSalvo);
} catch {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../index.html";
}

const nomeUsuario = document.getElementById("nomeUsuario");
const emailUsuario = document.getElementById("emailUsuario");
const avatarUsuario = document.getElementById("avatarUsuario");

const statMesNome = document.getElementById("statMesNome");
const statDiasComConsulta = document.getElementById("statDiasComConsulta");
const statPagasMes = document.getElementById("statPagasMes");
const statPendentesMes = document.getElementById("statPendentesMes");

const btnMesAnterior = document.getElementById("btnMesAnterior");
const btnMesProximo = document.getElementById("btnMesProximo");
const btnHoje = document.getElementById("btnHoje");

const tituloCalendario = document.getElementById("tituloCalendario");
const subtituloCalendario = document.getElementById("subtituloCalendario");
const calendarGrid = document.getElementById("calendarGrid");

const tituloDiaSelecionado = document.getElementById("tituloDiaSelecionado");
const subtituloDiaSelecionado = document.getElementById("subtituloDiaSelecionado");
const detalheTotal = document.getElementById("detalheTotal");
const detalhePagas = document.getElementById("detalhePagas");
const detalhePendentes = document.getElementById("detalhePendentes");
const listaConsultasDia = document.getElementById("listaConsultasDia");

const searchTopbar = document.getElementById("searchTopbar");
const searchDia = document.getElementById("searchDia");
const logoutBtn = document.getElementById("logoutBtn");

const hoje = new Date();
let mesAtual = hoje.getMonth();
let anoAtual = hoje.getFullYear();
let dataSelecionada = null;

let resumoMes = [];
let mapaResumo = {};
let consultasDoDia = [];

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function preencherUsuarioNaTela() {
  nomeUsuario.textContent = usuario?.nome || "Usuário";
  emailUsuario.textContent = usuario?.email || "";
  avatarUsuario.textContent = (usuario?.nome || "U").charAt(0).toUpperCase();
}

function formatarDataISO(ano, mes, dia) {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${ano}-${mm}-${dd}`;
}

function formatarDataExtensa(dataIso) {
  const data = new Date(`${dataIso}T00:00:00`);
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizarResumoItem(item) {
  const data =
    item.data ||
    item.data_consulta ||
    item.dia ||
    item.date ||
    null;

  const total =
    Number(item.total_consultas ?? item.total ?? item.quantidade ?? 0) || 0;

  const pagas =
    Number(item.pagas ?? item.total_pagas ?? item.pago ?? 0) || 0;

  const pendentes =
    Number(item.pendentes ?? item.total_pendentes ?? item.pendente ?? 0) || 0;

  return { data, total, pagas, pendentes };
}

function montarMapaResumo(resumo) {
  const mapa = {};

  for (const item of resumo) {
    const normalizado = normalizarResumoItem(item);
    if (!normalizado.data) continue;
    mapa[normalizado.data] = normalizado;
  }

  return mapa;
}

async function carregarResumoCalendario() {
  try {
    const mes = mesAtual + 1;

    const resposta = await fetch(
      `${API_URL}/consultas/calendario/resumo?mes=${mes}&ano=${anoAtual}`,
      {
        headers: getAuthHeaders(),
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar o resumo do calendário.");
    }

    resumoMes = Array.isArray(dados.resumo) ? dados.resumo : [];
    mapaResumo = montarMapaResumo(resumoMes);

    atualizarCardsMes();
    renderizarCalendario();
  } catch (error) {
    console.error(error);
    resumoMes = [];
    mapaResumo = {};
    atualizarCardsMes();
    renderizarCalendario();
  }
}

function atualizarCardsMes() {
  const nomeMes = meses[mesAtual];
  const diasComConsulta = resumoMes.filter((item) => {
    const normalizado = normalizarResumoItem(item);
    return normalizado.total > 0;
  }).length;

  const totalPagas = resumoMes.reduce((acc, item) => {
    const normalizado = normalizarResumoItem(item);
    return acc + normalizado.pagas;
  }, 0);

  const totalPendentes = resumoMes.reduce((acc, item) => {
    const normalizado = normalizarResumoItem(item);
    return acc + normalizado.pendentes;
  }, 0);

  statMesNome.textContent = nomeMes;
  statDiasComConsulta.textContent = diasComConsulta;
  statPagasMes.textContent = totalPagas;
  statPendentesMes.textContent = totalPendentes;
}

function renderizarCalendario() {
  calendarGrid.innerHTML = "";

  tituloCalendario.textContent = meses[mesAtual];
  subtituloCalendario.textContent = String(anoAtual);

  const primeiroDia = new Date(anoAtual, mesAtual, 1);
  const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const inicioSemana = primeiroDia.getDay();

  const ultimoDiaMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();

  for (let i = 0; i < inicioSemana; i++) {
    const dia = ultimoDiaMesAnterior - inicioSemana + i + 1;
    const dataCard = document.createElement("button");
    dataCard.type = "button";
    dataCard.className = "calendar-day muted";

    dataCard.innerHTML = `
      <span class="day-number">${dia}</span>
    `;

    calendarGrid.appendChild(dataCard);
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataIso = formatarDataISO(anoAtual, mesAtual, dia);
    const resumo = mapaResumo[dataIso] || { total: 0, pagas: 0, pendentes: 0 };

    const card = document.createElement("button");
    card.type = "button";
    card.className = "calendar-day";
    card.dataset.date = dataIso;

    const dataHojeIso = formatarDataISO(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate()
    );

    if (dataIso === dataHojeIso) {
      card.classList.add("today");
    }

    if (dataSelecionada === dataIso) {
      card.classList.add("selected");
    }

    card.innerHTML = `
      <span class="day-number">${dia}</span>

      <div class="day-summary">
        ${
          resumo.total > 0
            ? `
              <span class="day-badge total">${resumo.total} consulta(s)</span>
              ${resumo.pagas > 0 ? `<span class="day-badge pago">${resumo.pagas} paga(s)</span>` : ""}
              ${resumo.pendentes > 0 ? `<span class="day-badge pendente">${resumo.pendentes} pendente(s)</span>` : ""}
            `
            : ""
        }
      </div>
    `;

    card.addEventListener("click", async () => {
      dataSelecionada = dataIso;
      renderizarCalendario();
      await carregarConsultasDoDia(dataIso);
    });

    calendarGrid.appendChild(card);
  }

  const totalCelas = inicioSemana + diasNoMes;
  const restantes = (7 - (totalCelas % 7)) % 7;

  for (let i = 1; i <= restantes; i++) {
    const dataCard = document.createElement("button");
    dataCard.type = "button";
    dataCard.className = "calendar-day muted";

    dataCard.innerHTML = `
      <span class="day-number">${i}</span>
    `;

    calendarGrid.appendChild(dataCard);
  }
}

function normalizarConsulta(consulta) {
  return {
    id: consulta.id,
    pacienteNome:
      consulta.paciente?.nome ||
      consulta.nome_paciente ||
      "Paciente não informado",
    cpf:
      consulta.paciente?.cpf ||
      consulta.cpf ||
      "Não informado",
    telefone:
      consulta.paciente?.telefone ||
      consulta.telefone ||
      "Não informado",
    hora: consulta.hora_consulta || "-",
    statusPagamento: consulta.status_pagamento || "pendente",
    observacoes: consulta.observacoes || "",
    dataConsulta: consulta.data_consulta || "",
  };
}

async function carregarConsultasDoDia(dataIso) {
  try {
    const resposta = await fetch(`${API_URL}/consultas?data=${dataIso}`, {
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar as consultas do dia.");
    }

    consultasDoDia = Array.isArray(dados.consultas)
      ? dados.consultas.map(normalizarConsulta)
      : [];

    renderizarPainelDoDia();
  } catch (error) {
    console.error(error);
    consultasDoDia = [];
    renderizarPainelDoDia("Erro ao carregar consultas do dia.");
  }
}

function obterConsultasDiaFiltradas() {
  const termo = (searchDia.value || searchTopbar.value || "").trim().toLowerCase();

  if (!termo) return consultasDoDia;

  return consultasDoDia.filter((item) => {
    return (
      item.pacienteNome.toLowerCase().includes(termo) ||
      item.cpf.toLowerCase().includes(termo) ||
      item.telefone.toLowerCase().includes(termo)
    );
  });
}

function renderizarPainelDoDia(mensagemErro = "") {
  if (!dataSelecionada) {
    tituloDiaSelecionado.textContent = "Detalhes do dia";
    subtituloDiaSelecionado.textContent = "Selecione um dia no calendário";
    detalheTotal.textContent = "0";
    detalhePagas.textContent = "0";
    detalhePendentes.textContent = "0";
    listaConsultasDia.innerHTML = `
      <div class="empty-day">
        Selecione um dia para visualizar as consultas.
      </div>
    `;
    return;
  }

  const lista = obterConsultasDiaFiltradas();
  const total = consultasDoDia.length;
  const pagas = consultasDoDia.filter((item) => item.statusPagamento === "pago").length;
  const pendentes = consultasDoDia.filter((item) => item.statusPagamento === "pendente").length;

  tituloDiaSelecionado.textContent = "Consultas do dia";
  subtituloDiaSelecionado.textContent = formatarDataExtensa(dataSelecionada);

  detalheTotal.textContent = String(total);
  detalhePagas.textContent = String(pagas);
  detalhePendentes.textContent = String(pendentes);

  if (mensagemErro) {
    listaConsultasDia.innerHTML = `
      <div class="empty-day">${mensagemErro}</div>
    `;
    return;
  }

  if (!lista.length) {
    listaConsultasDia.innerHTML = `
      <div class="empty-day">
        ${
          consultasDoDia.length
            ? "Nenhum paciente encontrado com esse filtro."
            : "Nenhuma consulta para este dia."
        }
      </div>
    `;
    return;
  }

  listaConsultasDia.innerHTML = lista
    .map((item) => {
      const statusClass = item.statusPagamento === "pago" ? "pago" : "pendente";
      const statusLabel = item.statusPagamento === "pago" ? "Pago" : "Pendente";

      return `
        <article class="day-card">
          <div class="day-card-top">
            <strong class="day-card-name">${item.pacienteNome}</strong>
            <span class="day-card-status ${statusClass}">${statusLabel}</span>
          </div>

          <div class="day-card-meta">
            <span><strong>CPF:</strong> ${item.cpf}</span>
            <span><strong>Telefone:</strong> ${item.telefone}</span>
            <span><strong>Hora:</strong> ${item.hora}</span>
            <span><strong>Observações:</strong> ${item.observacoes || "Sem observações"}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

searchDia.addEventListener("input", renderizarPainelDoDia);
searchTopbar.addEventListener("input", renderizarPainelDoDia);

btnMesAnterior.addEventListener("click", async () => {
  mesAtual--;

  if (mesAtual < 0) {
    mesAtual = 11;
    anoAtual--;
  }

  dataSelecionada = null;
  consultasDoDia = [];
  renderizarPainelDoDia();
  await carregarResumoCalendario();
});

btnMesProximo.addEventListener("click", async () => {
  mesAtual++;

  if (mesAtual > 11) {
    mesAtual = 0;
    anoAtual++;
  }

  dataSelecionada = null;
  consultasDoDia = [];
  renderizarPainelDoDia();
  await carregarResumoCalendario();
});

btnHoje.addEventListener("click", async () => {
  mesAtual = hoje.getMonth();
  anoAtual = hoje.getFullYear();
  dataSelecionada = formatarDataISO(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  await carregarResumoCalendario();
  await carregarConsultasDoDia(dataSelecionada);
  renderizarCalendario();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../index.html";
});

async function validarSessao() {
  try {
    const resposta = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resposta.ok) {
      throw new Error("Sessão inválida.");
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "../index.html";
  }
}

async function init() {
  preencherUsuarioNaTela();
  renderizarPainelDoDia();
  await validarSessao();
  await carregarResumoCalendario();
}

init();