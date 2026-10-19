
import { supabase } from "../lib/supabase";
import {
  getPendingParticipants,
  updateParticipantSyncStatus,
} from "../storage/participantsStorage";
import type { ConflictReason } from "../database/types";

type SyncResponse = {
  status: "synced" | "conflict" | "error";
  code?: string;
  reason?: string;
  message?: string;
  id?: string;
};

export type SyncSummary = {
  synced: number;
  conflicts: number;
  pending: number;
};

let syncing = false;

export async function syncPendingParticipants(): Promise<SyncSummary> {
  const summary: SyncSummary = {
    synced: 0,
    conflicts: 0,
    pending: 0,
  };

  if (syncing) return summary;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return summary;
  }

  syncing = true;

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.info("[GF Sync] Dispositivo não autenticado.");
      return summary;
    }

    const pending = await getPendingParticipants();

    for (const participant of pending) {
      try {
        const { data, error } = await supabase.rpc("sync_participant", {
          p_id: participant.id,
          p_name: participant.name,
          p_company: participant.company,
          p_role: participant.role,
          p_phone: participant.phone,
          p_created_at: participant.createdAt,
        });

        if (error) {
          console.warn("[GF Sync] Falha de comunicação:", error.message);
          continue;
        }

        const response = data as SyncResponse;

        if (response?.status === "synced") {
          await updateParticipantSyncStatus(
            participant.id,
            "synced",
            undefined,
            new Date().toISOString()
          );
          summary.synced++;
        } else if (response?.status === "conflict") {
          const reason = response.reason;

          if (reason === "duplicate_phone" || reason === "company_limit") {
            await updateParticipantSyncStatus(
              participant.id,
              "conflict",
              reason as ConflictReason
            );
            summary.conflicts++;
          } else {
            console.warn("[GF Sync] Conflito não reconhecido:", response);
          }
        } else {
          console.warn("[GF Sync] Cadastro permanece pendente:", response);
        }
      } catch (error) {
        console.warn("[GF Sync] Erro ao sincronizar participante:", error);
      }
    }

    summary.pending = (await getPendingParticipants()).length;

    return summary;
  } catch (error) {
    console.warn("[GF Sync] Sincronização não concluída:", error);
    return summary;
  } finally {
    syncing = false;
  }
}
