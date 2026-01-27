import { supabase } from "./supabase.js";

export async function requireAuth({ redirectTo = "index.html" } = {}) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Erro ao obter sessão:", error);
    if (redirectTo) {
      window.location.href = redirectTo;
    }
    throw error;
  }

  if (!session) {
    if (redirectTo) {
      window.location.href = redirectTo;
    }
    throw new Error("No active session");
  }

  return session.user;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signOut() {
  // Ensure local session is cleared even if the network request fails.
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    console.error("Erro ao sair:", error);
  } finally {
    // Replace to prevent navigating "back" into an authenticated page.
    window.location.replace("index.html");
  }
}
