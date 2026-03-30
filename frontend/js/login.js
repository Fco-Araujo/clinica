const API_URL = "https://friendly-spork-g4r4rw4wqq6phvx54-3000.app.github.dev";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const btnEntrar = document.getElementById("btnEntrar");
const mensagem = document.getElementById("mensagem");
const toggleSenha = document.getElementById("toggleSenha");

toggleSenha.addEventListener("click", () => {
  const isPassword = senhaInput.type === "password";
  senhaInput.type = isPassword ? "text" : "password";
  toggleSenha.textContent = isPassword ? "Ocultar" : "Mostrar";
});

function setMensagem(texto, tipo = "") {
  mensagem.textContent = texto;
  mensagem.className = "mensagem-feedback";

  if (tipo) {
    mensagem.classList.add(tipo);
  }
}

function setLoading(loading) {
  btnEntrar.disabled = loading;
  btnEntrar.textContent = loading ? "Entrando..." : "Entrar";
}

function salvarSessao(dados) {
  localStorage.setItem("token", dados.token);
  localStorage.setItem("usuario", JSON.stringify(dados.usuario));
}

function redirecionarAposLogin() {
  window.location.href = "./pages/pacientes.html";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const senha = senhaInput.value.trim();

  if (!email || !senha) {
    setMensagem("Preencha e-mail e senha.", "erro");
    return;
  }

  try {
    setLoading(true);
    setMensagem("");

    const resposta = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    const texto = await resposta.text();

    let dados;
    try {
      dados = JSON.parse(texto);
    } catch {
      throw new Error("A API não retornou uma resposta válida.");
    }

    if (!resposta.ok) {
      throw new Error(dados.erro || "Não foi possível fazer login.");
    }

    if (!dados.token || !dados.usuario) {
      throw new Error("A resposta da API não trouxe token e usuario.");
    }

    salvarSessao(dados);
    setMensagem("Login realizado com sucesso.", "sucesso");

    setTimeout(() => {
      redirecionarAposLogin();
    }, 700);
  } catch (error) {
    console.error("Erro no login:", error);
    setMensagem(error.message || "Erro ao conectar com o servidor.", "erro");
  } finally {
    setLoading(false);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");

  if (token && usuario) {
    try {
      JSON.parse(usuario);
      redirecionarAposLogin();
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
    }
  }
});