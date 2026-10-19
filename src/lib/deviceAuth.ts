
import { supabase } from "./supabase";

/**
 * Autentica o dispositivo usando uma conta técnica
 * previamente cadastrada no Supabase.
 */
export async function signInDevice(
  email: string,
  password: string
): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error("Não foi possível autenticar o dispositivo.");
  }
}

/**
 * Verifica se existe uma sessão autenticada.
 */
export async function isDeviceAuthenticated(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();

  return !error && !!data.session;
}

/**
 * Encerra a sessão técnica do dispositivo.
 */
export async function signOutDevice(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Não foi possível encerrar a sessão do dispositivo.");
  }
}
