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

const isAdmin = usuario?.perfil === "admin";

const nomeUsuario = document.getElementById("nomeUsuario");
const emailUsuario = document.getElementById("emailUsuario");
const avatarUsuario = document.getElementById("avatarUsuario");
const usuariosNavItem = document.getElementById("usuariosNavItem");
const logoutBtn = document.getElementById("logoutBtn");
const btnAtualizarDashboard = document.getElementById("btnAtualizarDashboard");

const statPacientes = document.getElementById("statPacientes");
const statConsultas = document.getElementById("statConsultas");
const statPagas = document.getElementById("statPagas");
const statPendentes = document.getElementById("statPendentes");

const kpiHoje = document.getElementById("kpiHoje");
const kpiDiasMes = document.getElementById("kpiDiasMes");
const kpiSus = document.getElementById("kpiSus");
const kpiMaster = document.getElementById("kpiMaster");
const kpiParticular = document.getElementById("kpiParticular");
const kpiPagasMes = document.getElementById("kpiPagasMes");
const kpiPendentesMes = document.getElementById("kpiPendentesMes");

const tbodyProximasConsultas = document.getElementById("tbodyProximasConsultas");
const listaPacientesRecentes = document.getElementById("listaPacientesRecentes");
const searchTopbar = document.getElementById("searchTopbar");

let pacientes = [];
let consultas = [];
let resumoMes = [];

let chartPagamento = null;
let chartMensal = null;
let chartTipoAtendimento = null;

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

  if (!isAdmin) {
    usuariosNavItem.style.display = "none";
  }
}

function formatarDataBR(data) {
  if (!data) return "-";
  const dataObj = new Date(`${data}T00:00:00`);
  return dataObj.toLocaleDateString("pt-BR");
}

function getTipoBadgeClass(tipo) {
  const normalizado = String(tipo || "").toUpperCase();

  if (normalizado === "SUS") return "sus";
  if (normalizado === "MASTER") return "master";
  return "particular";
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

  const sus =
    Number(item.sus ?? item.total_sus ?? 0) || 0;

  const master =
    Number(item.master ?? item.total_master ?? 0) || 0;

  const particular =
    Number(item.particular ?? item.total_particular ?? 0) || 0;

  return { data, total, pagas, pendentes, sus, master, particular };
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
    dataConsulta: consulta.data_consulta || "",
    horaConsulta: consulta.hora_consulta || "-",
    statusPagamento: consulta.status_pagamento || "pendente",
    tipoAtendimento: consulta.tipo_atendimento || "PARTICULAR",
    observacoes: consulta.observacoes || "",
  };
}

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

async function carregarPacientes() {
  const resposta = await fetch(`${API_URL}/pacientes`, {
    headers: getAuthHeaders(),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Não foi possível carregar pacientes.");
  }

  pacientes = dados.pacientes || [];
}

async function carregarConsultas() {
  const resposta = await fetch(`${API_URL}/consultas`, {
    headers: getAuthHeaders(),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Não foi possível carregar consultas.");
  }

  consultas = Array.isArray(dados.consultas)
    ? dados.consultas.map(normalizarConsulta)
    : [];
}

async function carregarResumoMes() {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  const resposta = await fetch(
    `${API_URL}/consultas/calendario/resumo?mes=${mes}&ano=${ano}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Não foi possível carregar o resumo mensal.");
  }

  resumoMes = Array.isArray(dados.resumo) ? dados.resumo.map(normalizarResumoItem) : [];
}

function atualizarCards() {
  const totalPacientes = pacientes.length;
  const totalConsultas = consultas.length;
  const pagas = consultas.filter(
    (item) => item.tipoAtendimento !== "SUS" && item.statusPagamento === "pago"
  ).length;
  const pendentes = consultas.filter(
    (item) => item.tipoAtendimento !== "SUS" && item.statusPagamento === "pendente"
  ).length;

  const sus = consultas.filter((item) => item.tipoAtendimento === "SUS").length;
  const master = consultas.filter((item) => item.tipoAtendimento === "MASTER").length;
  const particular = consultas.filter(
    (item) => item.tipoAtendimento === "PARTICULAR"
  ).length;

  const hojeIso = new Date().toISOString().slice(0, 10);
  const consultasHoje = consultas.filter((item) => item.dataConsulta === hojeIso).length;

  const diasComConsulta = resumoMes.filter((item) => item.total > 0).length;
  const pagasMes = resumoMes.reduce((acc, item) => acc + item.pagas, 0);
  const pendentesMes = resumoMes.reduce((acc, item) => acc + item.pendentes, 0);

  statPacientes.textContent = totalPacientes;
  statConsultas.textContent = totalConsultas;
  statPagas.textContent = pagas;
  statPendentes.textContent = pendentes;

  kpiHoje.textContent = consultasHoje;
  kpiDiasMes.textContent = diasComConsulta;
  kpiSus.textContent = sus;
  kpiMaster.textContent = master;
  kpiParticular.textContent = particular;
  kpiPagasMes.textContent = pagasMes;
  kpiPendentesMes.textContent = pendentesMes;
}

function renderizarChartPagamento() {
  const ctx = document.getElementById("chartPagamento");

  if (chartPagamento) {
    chartPagamento.destroy();
  }

  const pagas = consultas.filter(
    (item) => item.tipoAtendimento !== "SUS" && item.statusPagamento === "pago"
  ).length;

  const pendentes = consultas.filter(
    (item) => item.tipoAtendimento !== "SUS" && item.statusPagamento === "pendente"
  ).length;

  chartPagamento = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pagas", "Pendentes"],
      datasets: [
        {
          data: [pagas, pendentes],
          backgroundColor: ["#1fa971", "#f59e0b"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function renderizarChartTipoAtendimento() {
  const ctx = document.getElementById("chartTipoAtendimento");

  if (chartTipoAtendimento) {
    chartTipoAtendimento.destroy();
  }

  const sus = consultas.filter((item) => item.tipoAtendimento === "SUS").length;
  const master = consultas.filter((item) => item.tipoAtendimento === "MASTER").length;
  const particular = consultas.filter(
    (item) => item.tipoAtendimento === "PARTICULAR"
  ).length;

  chartTipoAtendimento = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["SUS", "MASTER", "PARTICULAR"],
      datasets: [
        {
          data: [sus, master, particular],
          backgroundColor: ["#4f7cff", "#8b5cf6", "#ff8a17"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

function renderizarChartMensal() {
  const ctx = document.getElementById("chartMensal");

  if (chartMensal) {
    chartMensal.destroy();
  }

  const labels = resumoMes.map((item) => formatarDataBR(item.data));
  const total = resumoMes.map((item) => item.total);
  const sus = resumoMes.map((item) => item.sus || 0);
  const master = resumoMes.map((item) => item.master || 0);
  const particular = resumoMes.map((item) => item.particular || 0);

  chartMensal = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total",
          data: total,
          backgroundColor: "#173679",
          borderRadius: 8,
        },
        {
          label: "SUS",
          data: sus,
          backgroundColor: "#4f7cff",
          borderRadius: 8,
        },
        {
          label: "MASTER",
          data: master,
          backgroundColor: "#8b5cf6",
          borderRadius: 8,
        },
        {
          label: "PARTICULAR",
          data: particular,
          backgroundColor: "#ff8a17",
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

function obterConsultasFiltradasBusca() {
  const termo = searchTopbar.value.trim().toLowerCase();

  if (!termo) return consultas;

  return consultas.filter((item) => {
    return (
      item.pacienteNome.toLowerCase().includes(termo) ||
      item.cpf.toLowerCase().includes(termo) ||
      item.telefone.toLowerCase().includes(termo) ||
      item.tipoAtendimento.toLowerCase().includes(termo)
    );
  });
}

function renderizarProximasConsultas() {
  const hojeBase = new Date();
  hojeBase.setHours(0, 0, 0, 0);

  const filtradas = obterConsultasFiltradasBusca();

  const futuras = filtradas
    .filter((item) => item.dataConsulta)
    .sort((a, b) => {
      const dataA = new Date(`${a.dataConsulta}T${a.horaConsulta === "-" ? "00:00" : a.horaConsulta}`);
      const dataB = new Date(`${b.dataConsulta}T${b.horaConsulta === "-" ? "00:00" : b.horaConsulta}`);
      return dataA - dataB;
    })
    .filter((item) => {
      const data = new Date(`${item.dataConsulta}T${item.horaConsulta === "-" ? "00:00" : item.horaConsulta}`);
      return data >= hojeBase;
    })
    .slice(0, 8);

  if (!futuras.length) {
    tbodyProximasConsultas.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">Nenhuma consulta encontrada.</td>
      </tr>
    `;
    return;
  }

  tbodyProximasConsultas.innerHTML = futuras
    .map((item) => {
      const tipoClass = getTipoBadgeClass(item.tipoAtendimento);

      let pagamentoHtml = `<span>-</span>`;
      if (item.tipoAtendimento !== "SUS") {
        pagamentoHtml = `
          <span class="badge-status ${item.statusPagamento === "pago" ? "pago" : "pendente"}">
            ${item.statusPagamento === "pago" ? "Pago" : "Pendente"}
          </span>
        `;
      }

      return `
        <tr>
          <td>${item.pacienteNome}</td>
          <td>${formatarDataBR(item.dataConsulta)}</td>
          <td>${item.horaConsulta}</td>
          <td><span class="badge-status ${tipoClass}">${item.tipoAtendimento}</span></td>
          <td>${pagamentoHtml}</td>
        </tr>
      `;
    })
    .join("");
}

function renderizarPacientesRecentes() {
  const termo = searchTopbar.value.trim().toLowerCase();

  const filtradas = termo
    ? pacientes.filter((item) => {
        return (
          (item.nome || "").toLowerCase().includes(termo) ||
          (item.cpf || "").toLowerCase().includes(termo) ||
          (item.telefone || "").toLowerCase().includes(termo)
        );
      })
    : pacientes;

  const recentes = [...filtradas].slice(0, 8);

  if (!recentes.length) {
    listaPacientesRecentes.innerHTML = `
      <div class="empty-list">Nenhum paciente encontrado.</div>
    `;
    return;
  }

  listaPacientesRecentes.innerHTML = recentes
    .map(
      (item) => `
        <article class="recent-item">
          <strong>${item.nome || "Sem nome"}</strong>
          <span><strong>CPF:</strong> ${item.cpf || "Não informado"}</span>
          <span><strong>Telefone:</strong> ${item.telefone || "Não informado"}</span>
        </article>
      `
    )
    .join("");
}

function renderizarDashboard() {
  atualizarCards();
  renderizarChartPagamento();
  renderizarChartTipoAtendimento();
  renderizarChartMensal();
  renderizarProximasConsultas();
  renderizarPacientesRecentes();
}

async function carregarTudo() {
  btnAtualizarDashboard.disabled = true;
  btnAtualizarDashboard.textContent = "Atualizando...";

  try {
    await Promise.all([
      carregarPacientes(),
      carregarConsultas(),
      carregarResumoMes(),
    ]);

    renderizarDashboard();
  } catch (error) {
    console.error(error);

    tbodyProximasConsultas.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">Erro ao carregar dashboard.</td>
      </tr>
    `;

    listaPacientesRecentes.innerHTML = `
      <div class="empty-list">Erro ao carregar dados.</div>
    `;
  } finally {
    btnAtualizarDashboard.disabled = false;
    btnAtualizarDashboard.textContent = "Atualizar dados";
  }
}

searchTopbar.addEventListener("input", () => {
  renderizarProximasConsultas();
  renderizarPacientesRecentes();
});

btnAtualizarDashboard.addEventListener("click", async () => {
  await carregarTudo();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../index.html";
});

async function init() {
  preencherUsuarioNaTela();
  await validarSessao();
  await carregarTudo();
}

init();