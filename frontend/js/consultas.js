const API_URL = "https://clinica-jmjw.onrender.com";

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

const statTotal = document.getElementById("statTotal");
const statPagas = document.getElementById("statPagas");
const statPendentes = document.getElementById("statPendentes");
const statFiltradas = document.getElementById("statFiltradas");

const filtroBusca = document.getElementById("filtroBusca");
const filtroData = document.getElementById("filtroData");
const filtroTipo = document.getElementById("filtroTipo");
const filtroPagamento = document.getElementById("filtroPagamento");
const searchTopbar = document.getElementById("searchTopbar");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");

const consultasTableBody = document.getElementById("consultasTableBody");
const consultasCards = document.getElementById("consultasCards");

const consultaForm = document.getElementById("consultaForm");
const consultaIdInput = document.getElementById("consultaId");
const pacienteNomeInput = document.getElementById("pacienteNome");
const consultaDataInput = document.getElementById("consultaData");
const consultaHoraInput = document.getElementById("consultaHora");
const consultaTipoInput = document.getElementById("consultaTipo");
const consultaPagamentoInput = document.getElementById("consultaPagamento");
const grupoConsultaPagamento = document.getElementById("grupoConsultaPagamento");
const consultaObservacoesInput = document.getElementById("consultaObservacoes");

const btnSalvarConsulta = document.getElementById("btnSalvarConsulta");
const btnAtualizarPagamento = document.getElementById("btnAtualizarPagamento");
const btnExcluirConsulta = document.getElementById("btnExcluirConsulta");
const mensagemConsulta = document.getElementById("mensagemConsulta");

const logoutBtn = document.getElementById("logoutBtn");

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuToggle = document.getElementById("menuToggle");

let consultas = [];
let consultaSelecionada = null;

function setMensagem(texto, tipo = "") {
  mensagemConsulta.textContent = texto;
  mensagemConsulta.className = "form-message";
  if (tipo) mensagemConsulta.classList.add(tipo);
}

function preencherUsuarioNaTela() {
  nomeUsuario.textContent = usuario?.nome || "Usuário";
  emailUsuario.textContent = usuario?.email || "";
  avatarUsuario.textContent = (usuario?.nome || "U").charAt(0).toUpperCase();
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function atualizarVisibilidadePagamentoDetalhe() {
  const tipo = consultaTipoInput.value;
  const ocultar = tipo === "SUS";
  grupoConsultaPagamento.style.display = ocultar ? "none" : "flex";
  btnAtualizarPagamento.style.display = ocultar || !isAdmin ? "none" : "block";
}

consultaTipoInput.addEventListener("change", atualizarVisibilidadePagamentoDetalhe);

function limparFormularioConsulta() {
  consultaSelecionada = null;
  consultaIdInput.value = "";
  pacienteNomeInput.value = "";
  consultaDataInput.value = "";
  consultaHoraInput.value = "";
  consultaTipoInput.value = "PARTICULAR";
  consultaPagamentoInput.value = "pendente";
  consultaObservacoesInput.value = "";
  atualizarVisibilidadePagamentoDetalhe();
  setMensagem("");
}

function controlarPermissoes() {
  if (!isAdmin) {
    consultaDataInput.disabled = true;
    consultaHoraInput.disabled = true;
    consultaTipoInput.disabled = true;
    consultaPagamentoInput.disabled = true;
    consultaObservacoesInput.disabled = true;
    btnSalvarConsulta.style.display = "none";
    btnAtualizarPagamento.style.display = "none";
    btnExcluirConsulta.style.display = "none";
  }
}

function formatarDataBR(data) {
  if (!data) return "-";
  const dataObj = new Date(`${data}T00:00:00`);
  return dataObj.toLocaleDateString("pt-BR");
}

function atualizarCards() {
  const total = consultas.length;
  const pagas = consultas.filter(
    (item) => item.tipo_atendimento !== "SUS" && item.status_pagamento === "pago"
  ).length;
  const pendentes = consultas.filter(
    (item) => item.tipo_atendimento !== "SUS" && item.status_pagamento === "pendente"
  ).length;
  const filtradas = obterConsultasFiltradas().length;

  statTotal.textContent = total;
  statPagas.textContent = pagas;
  statPendentes.textContent = pendentes;
  statFiltradas.textContent = filtradas;
}

async function carregarConsultas() {
  try {
    const params = new URLSearchParams();

    if (filtroData.value) {
      params.set("data", filtroData.value);
    }

    if (filtroPagamento.value) {
      params.set("status_pagamento", filtroPagamento.value);
    }

    if (filtroTipo.value) {
      params.set("tipo_atendimento", filtroTipo.value);
    }

    const query = params.toString();
    const url = query ? `${API_URL}/consultas?${query}` : `${API_URL}/consultas`;

    const resposta = await fetch(url, {
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar as consultas.");
    }

    consultas = dados.consultas || [];
    renderizarConsultas();
    atualizarCards();
  } catch (error) {
    console.error(error);
    consultasTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">Erro ao carregar consultas.</td>
      </tr>
    `;
    consultasCards.innerHTML = `<div class="empty-cards">Erro ao carregar consultas.</div>`;
  }
}

function obterConsultasFiltradas() {
  const termoBusca = (filtroBusca.value || searchTopbar.value || "")
    .trim()
    .toLowerCase();

  if (!termoBusca) {
    return consultas;
  }

  return consultas.filter((consulta) => {
    const pacienteNome = (consulta.paciente?.nome || consulta.nome_paciente || "").toLowerCase();
    const cpf = (consulta.paciente?.cpf || consulta.cpf || "").toLowerCase();
    const telefone = (consulta.paciente?.telefone || consulta.telefone || "").toLowerCase();
    const tipo = (consulta.tipo_atendimento || "").toLowerCase();

    return (
      pacienteNome.includes(termoBusca) ||
      cpf.includes(termoBusca) ||
      telefone.includes(termoBusca) ||
      tipo.includes(termoBusca)
    );
  });
}

function montarAcoesConsulta(consulta, tipo, status) {
  if (isAdmin) {
    return `
      <div class="table-actions consulta-card-actions">
        <button class="btn-table" data-open="${consulta.id}">Abrir</button>
        ${
          tipo !== "SUS"
            ? `<button class="btn-table" data-pay="${consulta.id}">
                ${status === "pago" ? "Marcar pendente" : "Marcar pago"}
              </button>`
            : ""
        }
        <button class="btn-table" data-delete="${consulta.id}">Excluir</button>
      </div>
    `;
  }

  return `
    <div class="table-actions consulta-card-actions">
      <button class="btn-table" data-open="${consulta.id}">Visualizar</button>
    </div>
  `;
}

function renderizarConsultas() {
  const filtradas = obterConsultasFiltradas();

  if (!filtradas.length) {
    consultasTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-table">Nenhuma consulta encontrada.</td>
      </tr>
    `;

    consultasCards.innerHTML = `
      <div class="empty-cards">Nenhuma consulta encontrada.</div>
    `;

    atualizarCards();
    return;
  }

  consultasTableBody.innerHTML = filtradas
    .map((consulta) => {
      const pacienteNome = consulta.paciente?.nome || consulta.nome_paciente || "Não informado";
      const cpf = consulta.paciente?.cpf || consulta.cpf || "Não informado";
      const telefone = consulta.paciente?.telefone || consulta.telefone || "Não informado";
      const data = formatarDataBR(consulta.data_consulta);
      const hora = consulta.hora_consulta || "-";
      const tipo = consulta.tipo_atendimento || "PARTICULAR";
      const status = consulta.status_pagamento || null;

      let pagamentoHtml = `<span>-</span>`;
      if (tipo !== "SUS") {
        pagamentoHtml = `
          <span class="badge-status ${status === "pago" ? "pago" : "pendente"}">
            ${status === "pago" ? "Pago" : "Pendente"}
          </span>
        `;
      }

      return `
        <tr>
          <td>${pacienteNome}</td>
          <td>${cpf}</td>
          <td>${telefone}</td>
          <td>${data}</td>
          <td>${hora}</td>
          <td>${tipo}</td>
          <td>${pagamentoHtml}</td>
          <td>${montarAcoesConsulta(consulta, tipo, status)}</td>
        </tr>
      `;
    })
    .join("");

  consultasCards.innerHTML = filtradas
    .map((consulta) => {
      const pacienteNome = consulta.paciente?.nome || consulta.nome_paciente || "Não informado";
      const cpf = consulta.paciente?.cpf || consulta.cpf || "Não informado";
      const telefone = consulta.paciente?.telefone || consulta.telefone || "Não informado";
      const data = formatarDataBR(consulta.data_consulta);
      const hora = consulta.hora_consulta || "-";
      const tipo = consulta.tipo_atendimento || "PARTICULAR";
      const status = consulta.status_pagamento || null;

      const pagamentoHtml =
        tipo === "SUS"
          ? `<span class="consulta-card-value">Não se aplica</span>`
          : `<span class="badge-status ${status === "pago" ? "pago" : "pendente"}">
              ${status === "pago" ? "Pago" : "Pendente"}
            </span>`;

      return `
        <article class="consulta-card">
          <div class="consulta-card-top">
            <strong class="consulta-card-name">${pacienteNome}</strong>
            <span class="badge-status consulta-card-type">${tipo}</span>
          </div>

          <div class="consulta-card-grid">
            <div class="consulta-card-item">
              <span class="consulta-card-label">CPF</span>
              <span class="consulta-card-value">${cpf}</span>
            </div>

            <div class="consulta-card-item">
              <span class="consulta-card-label">Telefone</span>
              <span class="consulta-card-value">${telefone}</span>
            </div>

            <div class="consulta-card-item">
              <span class="consulta-card-label">Data</span>
              <span class="consulta-card-value">${data}</span>
            </div>

            <div class="consulta-card-item">
              <span class="consulta-card-label">Hora</span>
              <span class="consulta-card-value">${hora}</span>
            </div>

            <div class="consulta-card-item">
              <span class="consulta-card-label">Pagamento</span>
              ${pagamentoHtml}
            </div>
          </div>

          ${montarAcoesConsulta(consulta, tipo, status)}
        </article>
      `;
    })
    .join("");

  atualizarCards();
}

async function abrirConsulta(id) {
  try {
    const resposta = await fetch(`${API_URL}/consultas/${id}`, {
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar a consulta.");
    }

    const consulta = dados.consulta;
    consultaSelecionada = consulta;

    consultaIdInput.value = consulta.id || "";
    pacienteNomeInput.value = consulta.paciente?.nome || consulta.nome_paciente || "Paciente";
    consultaDataInput.value = consulta.data_consulta || "";
    consultaHoraInput.value = consulta.hora_consulta || "";
    consultaTipoInput.value = consulta.tipo_atendimento || "PARTICULAR";
    consultaPagamentoInput.value = consulta.status_pagamento || "pendente";
    consultaObservacoesInput.value = consulta.observacoes || "";

    atualizarVisibilidadePagamentoDetalhe();
    setMensagem("Consulta carregada com sucesso.", "sucesso");
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao abrir consulta.", "erro");
  }
}

async function salvarConsulta() {
  if (!isAdmin) return;

  const id = consultaIdInput.value;
  if (!id) {
    setMensagem("Selecione uma consulta para editar.", "erro");
    return;
  }

  try {
    btnSalvarConsulta.disabled = true;
    btnSalvarConsulta.textContent = "Salvando...";

    const tipo_atendimento = consultaTipoInput.value;

    const payload = {
      data_consulta: consultaDataInput.value,
      hora_consulta: consultaHoraInput.value || null,
      tipo_atendimento,
      status_pagamento: tipo_atendimento === "SUS" ? null : consultaPagamentoInput.value,
      observacoes: consultaObservacoesInput.value.trim() || null,
    };

    const resposta = await fetch(`${API_URL}/consultas/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível atualizar a consulta.");
    }

    setMensagem("Consulta atualizada com sucesso.", "sucesso");
    await carregarConsultas();
    await abrirConsulta(id);
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao salvar consulta.", "erro");
  } finally {
    btnSalvarConsulta.disabled = false;
    btnSalvarConsulta.textContent = "Salvar alterações";
  }
}

async function atualizarPagamentoRapido(id, novoStatus) {
  if (!isAdmin) return;

  try {
    const resposta = await fetch(`${API_URL}/consultas/${id}/pagamento`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status_pagamento: novoStatus,
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível atualizar o pagamento.");
    }

    setMensagem("Pagamento atualizado com sucesso.", "sucesso");
    await carregarConsultas();

    if (consultaIdInput.value === String(id)) {
      await abrirConsulta(id);
    }
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao atualizar pagamento.", "erro");
  }
}

async function atualizarPagamentoSelecionado() {
  const id = consultaIdInput.value;
  if (!id) {
    setMensagem("Selecione uma consulta.", "erro");
    return;
  }

  if (consultaTipoInput.value === "SUS") {
    setMensagem("Consultas SUS não possuem controle de pagamento.", "erro");
    return;
  }

  await atualizarPagamentoRapido(id, consultaPagamentoInput.value);
}

async function excluirConsulta(id) {
  if (!isAdmin) return;

  const confirmar = window.confirm("Deseja realmente excluir esta consulta?");
  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_URL}/consultas/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível excluir a consulta.");
    }

    if (consultaIdInput.value === String(id)) {
      limparFormularioConsulta();
    }

    setMensagem("Consulta excluída com sucesso.", "sucesso");
    await carregarConsultas();
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao excluir consulta.", "erro");
  }
}

function lidarCliqueConsulta(event) {
  const botaoAbrir = event.target.closest("[data-open]");
  const botaoPagamento = event.target.closest("[data-pay]");
  const botaoExcluir = event.target.closest("[data-delete]");

  return { botaoAbrir, botaoPagamento, botaoExcluir };
}

async function processarAcaoConsulta(event) {
  const { botaoAbrir, botaoPagamento, botaoExcluir } = lidarCliqueConsulta(event);

  if (botaoAbrir) {
    await abrirConsulta(botaoAbrir.dataset.open);
  }

  if (botaoPagamento) {
    const id = botaoPagamento.dataset.pay;
    const consulta = consultas.find((item) => String(item.id) === String(id));
    if (!consulta || consulta.tipo_atendimento === "SUS") return;

    const novoStatus = consulta.status_pagamento === "pago" ? "pendente" : "pago";
    await atualizarPagamentoRapido(id, novoStatus);
  }

  if (botaoExcluir) {
    await excluirConsulta(botaoExcluir.dataset.delete);
  }
}

consultasTableBody.addEventListener("click", processarAcaoConsulta);
consultasCards.addEventListener("click", processarAcaoConsulta);

consultaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await salvarConsulta();
});

btnAtualizarPagamento.addEventListener("click", async () => {
  await atualizarPagamentoSelecionado();
});

btnExcluirConsulta.addEventListener("click", async () => {
  const id = consultaIdInput.value;
  if (!id) {
    setMensagem("Selecione uma consulta.", "erro");
    return;
  }

  await excluirConsulta(id);
});

filtroBusca.addEventListener("input", renderizarConsultas);
searchTopbar.addEventListener("input", renderizarConsultas);

filtroData.addEventListener("change", async () => {
  await carregarConsultas();
});

filtroPagamento.addEventListener("change", async () => {
  await carregarConsultas();
});

filtroTipo.addEventListener("change", async () => {
  await carregarConsultas();
});

btnLimparFiltros.addEventListener("click", async () => {
  filtroBusca.value = "";
  filtroData.value = "";
  filtroPagamento.value = "";
  filtroTipo.value = "";
  searchTopbar.value = "";
  await carregarConsultas();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../index.html";
});

function abrirMenuMobile() {
  if (!sidebar || !sidebarOverlay || !menuToggle) return;
  sidebar.classList.add("sidebar-open");
  sidebarOverlay.classList.add("show");
  document.body.classList.add("menu-open");
  menuToggle.setAttribute("aria-expanded", "true");
}

function fecharMenuMobile() {
  if (!sidebar || !sidebarOverlay || !menuToggle) return;
  sidebar.classList.remove("sidebar-open");
  sidebarOverlay.classList.remove("show");
  document.body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function configurarMenuMobile() {
  if (!menuToggle || !sidebar || !sidebarOverlay) return;

  menuToggle.addEventListener("click", () => {
    const aberto = sidebar.classList.contains("sidebar-open");
    if (aberto) {
      fecharMenuMobile();
    } else {
      abrirMenuMobile();
    }
  });

  sidebarOverlay.addEventListener("click", fecharMenuMobile);

  sidebar.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        fecharMenuMobile();
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      fecharMenuMobile();
    }
  });
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

async function init() {
  preencherUsuarioNaTela();
  controlarPermissoes();
  limparFormularioConsulta();
  configurarMenuMobile();
  await validarSessao();
  await carregarConsultas();
}

init();