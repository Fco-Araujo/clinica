const API_URL = "https://clinica-jmjw.onrender.com";

const token = localStorage.getItem("token");
const usuarioSalvo = localStorage.getItem("usuario");

if (!token || !usuarioSalvo) {
  window.location.href = "../index.html";
}

let usuarioLogado = null;

try {
  usuarioLogado = JSON.parse(usuarioSalvo);
} catch {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../index.html";
}

const isAdmin = usuarioLogado?.perfil === "admin";

if (!isAdmin) {
  window.location.href = "./dashboard.html";
}

const nomeUsuario = document.getElementById("nomeUsuario");
const emailUsuario = document.getElementById("emailUsuario");
const avatarUsuario = document.getElementById("avatarUsuario");

const usuarioForm = document.getElementById("usuarioForm");
const usuarioIdInput = document.getElementById("usuarioId");
const nomeNovoUsuarioInput = document.getElementById("nomeNovoUsuario");
const emailNovoUsuarioInput = document.getElementById("emailNovoUsuario");
const usernameNovoUsuarioInput = document.getElementById("usernameNovoUsuario");
const perfilNovoUsuarioInput = document.getElementById("perfilNovoUsuario");
const senhaNovoUsuarioInput = document.getElementById("senhaNovoUsuario");
const ativoNovoUsuarioInput = document.getElementById("ativoNovoUsuario");
const btnSalvarUsuario = document.getElementById("btnSalvarUsuario");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
const mensagemUsuario = document.getElementById("mensagemUsuario");

const listaUsuarios = document.getElementById("listaUsuarios");
const contadorUsuarios = document.getElementById("contadorUsuarios");
const searchUsuario = document.getElementById("searchUsuario");
const searchTopbar = document.getElementById("searchTopbar");
const logoutBtn = document.getElementById("logoutBtn");

let usuarios = [];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function preencherUsuarioNaTela() {
  nomeUsuario.textContent = usuarioLogado?.nome || "Usuário";
  emailUsuario.textContent = usuarioLogado?.email || "";
  avatarUsuario.textContent = (usuarioLogado?.nome || "U").charAt(0).toUpperCase();
}

function setMensagem(texto, tipo = "") {
  mensagemUsuario.textContent = texto;
  mensagemUsuario.className = "form-message";
  if (tipo) {
    mensagemUsuario.classList.add(tipo);
  }
}

function setLoading(loading) {
  btnSalvarUsuario.disabled = loading;
  btnSalvarUsuario.textContent = loading
    ? "Salvando..."
    : usuarioIdInput.value
    ? "Salvar alterações"
    : "Cadastrar usuário";
}

function limparFormulario() {
  usuarioIdInput.value = "";
  nomeNovoUsuarioInput.value = "";
  emailNovoUsuarioInput.value = "";
  usernameNovoUsuarioInput.value = "";
  perfilNovoUsuarioInput.value = "comum";
  senhaNovoUsuarioInput.value = "";
  ativoNovoUsuarioInput.value = "true";
  btnSalvarUsuario.textContent = "Cadastrar usuário";
  setMensagem("");
}

function preencherFormulario(usuario) {
  usuarioIdInput.value = usuario.id || "";
  nomeNovoUsuarioInput.value = usuario.nome || "";
  emailNovoUsuarioInput.value = usuario.email || "";
  usernameNovoUsuarioInput.value = usuario.username || "";
  perfilNovoUsuarioInput.value = usuario.perfil || "comum";
  senhaNovoUsuarioInput.value = "";
  ativoNovoUsuarioInput.value = String(usuario.ativo);
  btnSalvarUsuario.textContent = "Salvar alterações";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  setMensagem(`Usuário "${usuario.nome}" carregado para edição.`, "sucesso");
}

function obterUsuariosFiltrados() {
  const termo1 = searchUsuario.value.trim().toLowerCase();
  const termo2 = searchTopbar.value.trim().toLowerCase();
  const termo = termo1 || termo2;

  if (!termo) return usuarios;

  return usuarios.filter((usuario) => {
    const nome = (usuario.nome || "").toLowerCase();
    const email = (usuario.email || "").toLowerCase();
    const username = (usuario.username || "").toLowerCase();
    const perfil = (usuario.perfil || "").toLowerCase();

    return (
      nome.includes(termo) ||
      email.includes(termo) ||
      username.includes(termo) ||
      perfil.includes(termo)
    );
  });
}

function renderizarUsuarios() {
  const filtrados = obterUsuariosFiltrados();

  contadorUsuarios.textContent = `${filtrados.length} usuário(s)`;

  if (!filtrados.length) {
    listaUsuarios.innerHTML = `
      <div class="empty-state">
        Nenhum usuário encontrado.
      </div>
    `;
    return;
  }

  listaUsuarios.innerHTML = filtrados
    .map((usuario) => {
      const statusClass = usuario.ativo ? "ativo" : "inativo";
      const statusLabel = usuario.ativo ? "Ativo" : "Inativo";
      const perfilLabel = usuario.perfil === "admin" ? "Administrador" : "Funcionário";

      return `
        <article class="user-card">
          <div class="user-card-name">${usuario.nome || "Sem nome"}</div>

          <div class="user-info-list">
            <p class="user-info-line"><strong>Nome:</strong> ${usuario.nome || "Não informado"}</p>
            <p class="user-info-line"><strong>E-mail:</strong> ${usuario.email || "Não informado"}</p>
            <p class="user-info-line"><strong>Usuário:</strong> ${usuario.username || "Não informado"}</p>
            <p class="user-info-line"><strong>Perfil:</strong> ${perfilLabel}</p>
            <p class="user-info-line">
              <strong>Status:</strong>
              <span class="badge-status ${statusClass}">${statusLabel}</span>
            </p>
          </div>

          <div class="user-actions">
            <button class="btn-table" data-edit="${usuario.id}">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function carregarUsuarios() {
  try {
    const resposta = await fetch(`${API_URL}/usuarios`, {
      headers: getAuthHeaders(),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível carregar os usuários.");
    }

    usuarios = Array.isArray(dados) ? dados : dados.usuarios || [];
    renderizarUsuarios();
  } catch (error) {
    console.error(error);
    listaUsuarios.innerHTML = `
      <div class="empty-state">
        Erro ao carregar usuários.
      </div>
    `;
    contadorUsuarios.textContent = "0 usuário(s)";
  }
}

async function salvarUsuario(payload, usuarioId) {
  const url = usuarioId
    ? `${API_URL}/usuarios/${usuarioId}`
    : `${API_URL}/usuarios`;

  const metodo = usuarioId ? "PUT" : "POST";

  const resposta = await fetch(url, {
    method: metodo,
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Não foi possível salvar o usuário.");
  }

  return dados.usuario || dados;
}

usuarioForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const usuarioId = usuarioIdInput.value.trim();
  const nome = nomeNovoUsuarioInput.value.trim();
  const email = emailNovoUsuarioInput.value.trim();
  const username = usernameNovoUsuarioInput.value.trim();
  const perfil = perfilNovoUsuarioInput.value;
  const senha = senhaNovoUsuarioInput.value.trim();
  const ativo = ativoNovoUsuarioInput.value === "true";

  if (!nome || !email || !username) {
    setMensagem("Preencha nome, e-mail e usuário.", "erro");
    return;
  }

  if (!usuarioId && !senha) {
    setMensagem("Informe a senha para cadastrar um novo usuário.", "erro");
    return;
  }

  try {
    setLoading(true);
    setMensagem("");

    const payload = {
      nome,
      email,
      username,
      perfil,
      ativo,
    };

    if (senha) {
      payload.senha = senha;
    }

    await salvarUsuario(payload, usuarioId);

    setMensagem(
      usuarioId
        ? "Usuário atualizado com sucesso."
        : "Usuário cadastrado com sucesso.",
      "sucesso"
    );

    limparFormulario();
    await carregarUsuarios();
  } catch (error) {
    console.error(error);
    setMensagem(error.message || "Erro ao salvar usuário.", "erro");
  } finally {
    setLoading(false);
  }
});

listaUsuarios.addEventListener("click", (event) => {
  const botaoEditar = event.target.closest("[data-edit]");
  if (!botaoEditar) return;

  const id = botaoEditar.dataset.edit;
  const usuario = usuarios.find((item) => String(item.id) === String(id));

  if (usuario) {
    preencherFormulario(usuario);
  }
});

btnCancelarEdicao.addEventListener("click", () => {
  limparFormulario();
});

searchUsuario.addEventListener("input", renderizarUsuarios);
searchTopbar.addEventListener("input", renderizarUsuarios);

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

    const dados = await resposta.json();
    const perfil = dados.usuario?.perfil || usuarioLogado?.perfil;

    if (perfil !== "admin") {
      window.location.href = "./dashboard.html";
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "../index.html";
  }
}

async function init() {
  preencherUsuarioNaTela();
  limparFormulario();
  await validarSessao();
  await carregarUsuarios();
}

init();