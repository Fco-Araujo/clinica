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

const pacienteForm = document.getElementById("pacienteForm");
const pacienteIdInput = document.getElementById("pacienteId");
const nomePacienteInput = document.getElementById("nomePaciente");
const cpfPacienteInput = document.getElementById("cpfPaciente");
const telefonePacienteInput = document.getElementById("telefonePaciente");
const observacoesPacienteInput = document.getElementById("observacoesPaciente");

const dataConsultaInput = document.getElementById("dataConsulta");
const horaConsultaInput = document.getElementById("horaConsulta");
const tipoAtendimentoInput = document.getElementById("tipoAtendimento");
const statusPagamentoInput = document.getElementById("statusPagamento");
const grupoStatusPagamento = document.getElementById("grupoStatusPagamento");
const btnAdicionarAgendamento = document.getElementById("btnAdicionarAgendamento");
const listaAgendamentos = document.getElementById("listaAgendamentos");

const mensagemPaciente = document.getElementById("mensagemPaciente");
const btnSalvarPaciente = document.getElementById("btnSalvarPaciente");

const listaPacientes = document.getElementById("listaPacientes");
const searchPaciente = document.getElementById("searchPaciente");
const searchTopbar = document.getElementById("searchTopbar");
const contadorPacientes = document.getElementById("contadorPacientes");
const logoutBtn = document.getElementById("logoutBtn");

let pacientes = [];
let agendamentos = [];

function setMensagem(texto, tipo = "") {
  mensagemPaciente.textContent = texto;
  mensagemPaciente.className = "form-message";
  if (tipo) mensagemPaciente.classList.add(tipo);
}

function setLoading(loading) {
  btnSalvarPaciente.disabled = loading;
  btnSalvarPaciente.textContent = loading
    ? "Salvando..."
    : "Salvar Paciente e Consulta";
}

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

function atualizarVisibilidadePagamento() {
  const tipo = tipoAtendimentoInput.value;
  grupoStatusPagamento.style.display = tipo === "SUS" ? "none" : "flex";
}

tipoAtendimentoInput.addEventListener("change", atualizarVisibilidadePagamento);

function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatarCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

telefonePacienteInput.addEventListener("input", (e) => {
  e.target.value = formatarTelefone(e.target.value);
});

cpfPacienteInput.addEventListener("input", (e) => {
  e.target.value = formatarCPF(e.target.value);
});

function formatarDataBR(data) {
  const dataObj = new Date(`${data}T00:00:00`);
  return dataObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function renderizarAgendamentos() {
  if (!agendamentos.length) {
    listaAgendamentos.innerHTML = `
      <div class="appointment-item">
        <div class="appointment-left">
          <i class="fa-regular fa-calendar"></i>
          <span>Nenhum agendamento adicionado</span>
        </div>
      </div>
    `;
    return;
  }

  listaAgendamentos.innerHTML = agendamentos
    .map((item, index) => {
      const tipo = item.tipo_atendimento || "PARTICULAR";
      const exibirPagamento = tipo !== "SUS";
      const statusClass = item.status_pagamento === "pago" ? "pago" : "pendente";
      const statusLabel = item.status_pagamento === "pago" ? "Pago" : "Pendente";

      return `
        <div class="appointment-item">
          <div class="appointment-left">
            <i class="fa-regular fa-calendar"></i>
            <span>${item.dataFormatada} ${item.hora_consulta ? `às ${item.hora_consulta}` : ""}</span>
          </div>

          <div class="appointment-right">
            <span class="status-pill">${tipo}</span>
            ${
              exibirPagamento
                ? `<span class="status-pill ${statusClass}">${statusLabel}</span>`
                : ""
            }
            <button type="button" class="btn-mini-remove" data-index="${index}">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function adicionarAgendamento() {
  const data = dataConsultaInput.value;
  const hora = horaConsultaInput.value;
  const tipo_atendimento = tipoAtendimentoInput.value;

  let status_pagamento = null;
  if (tipo_atendimento !== "SUS") {
    status_pagamento = statusPagamentoInput.value;
  }

  if (!data) {
    setMensagem("Selecione a data do agendamento.", "erro");
    return;
  }

  const jaExiste = agendamentos.some(
    (item) =>
      item.data_consulta === data &&
      (item.hora_consulta || "") === (hora || "")
  );

  if (jaExiste) {
    setMensagem("Esse agendamento já foi adicionado.", "erro");
    return;
  }

  agendamentos.push({
    data_consulta: data,
    dataFormatada: formatarDataBR(data),
    hora_consulta: hora || null,
    tipo_atendimento,
    status_pagamento,
  });

  dataConsultaInput.value = "";
  horaConsultaInput.value = "";
  tipoAtendimentoInput.value = "PARTICULAR";
  statusPagamentoInput.value = "pendente";
  atualizarVisibilidadePagamento();

  setMensagem("");
  renderizarAgendamentos();
}

btnAdicionarAgendamento.addEventListener("click", adicionarAgendamento);

listaAgendamentos.addEventListener("click", (event) => {
  const botao = event.target.closest(".btn-mini-remove");
  if (!botao) return;

  const index = Number(botao.dataset.index);
  agendamentos.splice(index, 1);
  renderizarAgendamentos();
});

async function carregarPacientes() {
  try {
    const resposta = await fetch(`${API_URL}/pacientes`, {
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar os pacientes.");
    }

    pacientes = dados.pacientes || [];
    renderizarPacientes();
  } catch (error) {
    console.error(error);
    listaPacientes.innerHTML = `
      <div class="empty-state">
        Erro ao carregar pacientes.
      </div>
    `;
    contadorPacientes.textContent = "0 pacientes";
  }
}

function obterPacientesFiltrados() {
  const termo1 = searchPaciente.value.trim().toLowerCase();
  const termo2 = searchTopbar.value.trim().toLowerCase();
  const termo = termo1 || termo2;

  if (!termo) return pacientes;

  return pacientes.filter((paciente) => {
    const nome = (paciente.nome || "").toLowerCase();
    const cpf = (paciente.cpf || "").toLowerCase();
    const telefone = (paciente.telefone || "").toLowerCase();

    return nome.includes(termo) || cpf.includes(termo) || telefone.includes(termo);
  });
}

function renderizarPacientes() {
  const filtrados = obterPacientesFiltrados();

  contadorPacientes.textContent = `${filtrados.length} paciente(s)`;

  if (!filtrados.length) {
    listaPacientes.innerHTML = `
      <div class="empty-state">
        Nenhum paciente encontrado.
      </div>
    `;
    return;
  }

  listaPacientes.innerHTML = filtrados
    .map((paciente) => {
      const acoesAdmin = isAdmin
        ? `
          <div class="patient-actions">
            <button class="btn-table btn-edit" data-edit="${paciente.id}">
              <i class="fa-solid fa-pen"></i> Editar
            </button>

            <button class="btn-table btn-delete" data-delete="${paciente.id}">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        `
        : "";

      return `
        <article class="patient-card">
          <div class="patient-name-row">
            <strong class="patient-name">${paciente.nome || "Sem nome"}</strong>
            ${isAdmin ? `<button class="patient-action-link" data-abrir="${paciente.id}">Abrir</button>` : ""}
          </div>

          <div class="patient-info-list">
            <p class="patient-info-line"><strong>Nome:</strong> ${paciente.nome || "Não informado"}</p>
            <p class="patient-info-line"><strong>CPF:</strong> ${paciente.cpf || "Não informado"}</p>
            <p class="patient-info-line"><strong>Telefone:</strong> ${paciente.telefone || "Não informado"}</p>
          </div>

          ${acoesAdmin}
        </article>
      `;
    })
    .join("");
}

searchPaciente.addEventListener("input", renderizarPacientes);
searchTopbar.addEventListener("input", renderizarPacientes);

function preencherFormularioPaciente(paciente) {
  if (!isAdmin) return;

  pacienteIdInput.value = paciente.id || "";
  nomePacienteInput.value = paciente.nome || "";
  cpfPacienteInput.value = formatarCPF(paciente.cpf || "");
  telefonePacienteInput.value = paciente.telefone || "";
  observacoesPacienteInput.value = paciente.observacoes || "";

  agendamentos = [];
  renderizarAgendamentos();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  setMensagem(`Paciente "${paciente.nome}" carregado para edição.`, "sucesso");
}

async function excluirPaciente(id) {
  if (!isAdmin) return;

  const confirmar = window.confirm(
    "Deseja realmente excluir este paciente? As consultas vinculadas também serão removidas."
  );

  if (!confirmar) return;

  try {
    const resposta = await fetch(`${API_URL}/pacientes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível excluir o paciente.");
    }

    if (pacienteIdInput.value === String(id)) {
      limparFormulario();
    }

    setMensagem("Paciente excluído com sucesso.", "sucesso");
    await carregarPacientes();
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao excluir paciente.", "erro");
  }
}

listaPacientes.addEventListener("click", (event) => {
  const botaoEditar = event.target.closest("[data-edit]");
  const botaoAbrir = event.target.closest("[data-abrir]");
  const botaoExcluir = event.target.closest("[data-delete]");

  if (botaoEditar) {
    const id = botaoEditar.dataset.edit;
    const paciente = pacientes.find((item) => String(item.id) === String(id));
    if (paciente) preencherFormularioPaciente(paciente);
  }

  if (botaoAbrir) {
    const id = botaoAbrir.dataset.abrir;
    const paciente = pacientes.find((item) => String(item.id) === String(id));
    if (paciente) preencherFormularioPaciente(paciente);
  }

  if (botaoExcluir) {
    excluirPaciente(botaoExcluir.dataset.delete);
  }
});

function limparFormulario() {
  pacienteIdInput.value = "";
  nomePacienteInput.value = "";
  cpfPacienteInput.value = "";
  telefonePacienteInput.value = "";
  observacoesPacienteInput.value = "";
  dataConsultaInput.value = "";
  horaConsultaInput.value = "";
  tipoAtendimentoInput.value = "PARTICULAR";
  statusPagamentoInput.value = "pendente";
  agendamentos = [];
  atualizarVisibilidadePagamento();
  renderizarAgendamentos();
}

async function salvarPaciente(dadosPaciente) {
  const pacienteId = pacienteIdInput.value.trim();

  if (pacienteId && !isAdmin) {
    throw new Error("Apenas administradores podem editar pacientes.");
  }

  const url = pacienteId
    ? `${API_URL}/pacientes/${pacienteId}`
    : `${API_URL}/pacientes`;

  const metodo = pacienteId ? "PUT" : "POST";

  const resposta = await fetch(url, {
    method: metodo,
    headers: getAuthHeaders(),
    body: JSON.stringify(dadosPaciente),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Não foi possível salvar o paciente.");
  }

  return dados.paciente;
}

async function criarConsultas(pacienteId) {
  if (!agendamentos.length) return;

  for (const item of agendamentos) {
    const payload = {
      paciente_id: pacienteId,
      data_consulta: item.data_consulta,
      hora_consulta: item.hora_consulta,
      tipo_atendimento: item.tipo_atendimento,
      status_pagamento: item.tipo_atendimento === "SUS" ? null : item.status_pagamento,
      observacoes: observacoesPacienteInput.value.trim() || null,
    };

    const resposta = await fetch(`${API_URL}/consultas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível criar a consulta.");
    }
  }
}

pacienteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nome = nomePacienteInput.value.trim();
  const cpf = cpfPacienteInput.value.trim();
  const telefone = telefonePacienteInput.value.trim();
  const observacoes = observacoesPacienteInput.value.trim();

  if (!nome) {
    setMensagem("Informe o nome do paciente.", "erro");
    return;
  }

  if (!cpf) {
    setMensagem("Informe o CPF do paciente.", "erro");
    return;
  }

  try {
    setLoading(true);
    setMensagem("");

    const payloadPaciente = {
      nome,
      cpf,
      telefone,
      observacoes,
    };

    const pacienteSalvo = await salvarPaciente(payloadPaciente);

    if (!pacienteSalvo?.id) {
      throw new Error("Não foi possível identificar o paciente salvo.");
    }

    await criarConsultas(pacienteSalvo.id);

    setMensagem("Paciente e consulta salvos com sucesso.", "sucesso");
    limparFormulario();
    await carregarPacientes();
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao salvar paciente.", "erro");
  } finally {
    setLoading(false);
  }
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
  atualizarVisibilidadePagamento();
  renderizarAgendamentos();
  await validarSessao();
  await carregarPacientes();
}

init();