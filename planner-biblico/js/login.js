import { supabase } from "./supabase.js";
import { signIn, signUp } from "./auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register_btn");
const statusEl = document.getElementById("status");

const statusColors = {
  neutral: "var(--text-muted)",
  success: "var(--success)",
  error: "var(--error)",
};

const setStatus = (message, type = "neutral") => {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = statusColors[type] || statusColors.neutral;
};

const setLoading = (loading) => {
  if (loginBtn) loginBtn.disabled = loading;
  if (registerBtn) registerBtn.disabled = loading;
};

const normalizeEmail = (input) => (input?.value || "").trim();
const readPassword = (input) => input?.value || "";

const navigateToPlanner = () => {
  window.location.href = "planner.html";
};

const handleAuthError = (error) => {
  const raw = (error?.message || "").toString();
  const message = (() => {
    const m = raw.toLowerCase();
    if (m.includes("email not confirmed")) {
      return "Confirme seu email antes de entrar (verifique a caixa de entrada e o spam).";
    }
    if (m.includes("invalid login credentials")) {
      return "Email ou senha incorretos.";
    }
    return raw || "Erro inesperado. Tente novamente.";
  })();

  setStatus(message, "error");
};

const login = async () => {
  const email = normalizeEmail(emailInput);
  const password = readPassword(passwordInput);

  if (!email || !password) {
    setStatus("Informe email e senha", "error");
    return;
  }

  try {
    setLoading(true);
    setStatus("Entrando...", "neutral");
    await signIn(email, password);
    setStatus("Login confirmado. Redirecionando...", "success");
    setTimeout(navigateToPlanner, 200);
  } catch (error) {
    handleAuthError(error);
  } finally {
    setLoading(false);
  }
};

const register = async () => {
  const email = normalizeEmail(emailInput);
  const password = readPassword(passwordInput);

  if (!email || !password) {
    setStatus("Informe email e senha para cadastro", "error");
    return;
  }

  try {
    setLoading(true);
    setStatus("Criando conta...", "neutral");
    await signUp(email, password);
    setStatus("Conta criada! Verifique seu email e faça login.", "success");
  } catch (error) {
    handleAuthError(error);
  } finally {
    setLoading(false);
  }
};

const init = async () => {
  if (!emailInput || !passwordInput || !loginBtn || !registerBtn) return;

  // Always require credentials on the login screen (do not auto-redirect).
  try {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      await supabase.auth.signOut({ scope: "local" });
    }
  } catch {
    // ignore
  } finally {
    setLoading(false);
  }

  loginBtn.addEventListener("click", login);
  registerBtn.addEventListener("click", register);
};

init();
