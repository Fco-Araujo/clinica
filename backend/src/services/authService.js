import { supabaseAdmin } from "../config/supabase.js";
import { comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";

export async function loginUsuario(email, senha) {
  if (!supabaseAdmin) {
    throw new Error("Supabase não configurado.");
  }

  const { data: usuario, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, nome, email, senha_hash, perfil, ativo")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao buscar usuário.");
  }

  if (!usuario) {
    const err = new Error("E-mail ou senha inválidos.");
    err.statusCode = 401;
    throw err;
  }

  if (!usuario.ativo) {
    const err = new Error("Usuário inativo.");
    err.statusCode = 403;
    throw err;
  }

  const senhaValida = await comparePassword(senha, usuario.senha_hash);

  if (!senhaValida) {
    const err = new Error("E-mail ou senha inválidos.");
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  };
}