
import { supabase } from "../lib/supabase";
import { deleteParticipant } from "../storage/participantsStorage";

export async function deleteParticipantEverywhere(
  id: string
): Promise<void> {
  if (!id?.trim()) {
    throw new Error("Participante não identificado.");
  }

  if (!navigator.onLine) {
    throw new Error(
      "Conecte-se à internet para excluir o participante."
    );
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error(
      "Dispositivo não autenticado no Supabase."
    );
  }

  // Primeiro exclui no banco online.
  const { data, error } = await supabase.rpc(
    "delete_participant",
    { p_id: id }
  );

  if (error) {
    throw new Error(
      "Não foi possível excluir no Supabase: " +
        error.message
    );
  }

  // false significa que o registro já não existia online.
  // Isso também permite limpar um cadastro apenas local.
  if (data !== true && data !== false) {
    throw new Error(
      "Resposta inesperada do Supabase."
    );
  }

  // Só depois remove do banco local.
  await deleteParticipant(id);
}
