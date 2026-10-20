
import { supabase } from "../lib/supabase";

import {
  getPendingParticipants,
  importSyncedParticipants,
  updateParticipantSyncStatus,
} from "../storage/participantsStorage";

import { getDatabaseService } from "../database/databaseService";

import type { StoredParticipant } from "../database/types";

type SyncResponse = {
  status: "synced" | "conflict" | "error";
  code?: string;
  reason?: string;
  message?: string;
  id?: string;
};

type CloudParticipant = {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  created_at: string;
  synced_at: string | null;
};

export type SyncSummary = {
  synced: number;
  conflicts: number;
  pending: number;
  imported: number;
};

function createEmptySummary(): SyncSummary {
  return {
    synced: 0,
    conflicts: 0,
    pending: 0,
    imported: 0,
  };
}

/**
 * Impede sincronizações simultâneas.
 *
 * Se uma sincronização já estiver acontecendo,
 * as próximas chamadas aguardam a mesma operação.
 */
let currentSyncPromise: Promise<SyncSummary> | null = null;

function isOnline(): boolean {
  return (
    typeof navigator === "undefined" ||
    navigator.onLine
  );
}

/**
 * ==================================================
 * EXCLUIR CADASTRO REJEITADO DO BANCO LOCAL
 * ==================================================
 *
 * A exclusão acontece somente quando o Supabase
 * confirma uma rejeição definitiva:
 *
 * - duplicate_phone
 * - company_limit
 *
 * Não exclui cadastros por falhas de internet,
 * erros temporários ou respostas desconhecidas.
 */
async function removeRejectedParticipant(
  id: string
): Promise<void> {
  const database = getDatabaseService();

  await database.init();
  await database.deleteParticipant(id);
}

/**
 * ==================================================
 * BAIXAR PARTICIPANTES DO SUPABASE
 * ==================================================
 *
 * Importa os participantes confirmados na nuvem.
 * Utiliza paginação de 500 registros.
 */
async function downloadCloudParticipants(): Promise<number> {
  const PAGE_SIZE = 500;

  let offset = 0;
  let imported = 0;

  while (true) {
    const { data, error } = await supabase
      .from("participants")
      .select(
        "id, name, company, role, phone, created_at, synced_at"
      )
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(
        `Erro ao consultar participantes: ${error.message}`
      );
    }

    const records = (data || []) as CloudParticipant[];

    if (records.length === 0) {
      break;
    }

    const participants: StoredParticipant[] =
      records.map((record) => ({
        id: record.id,
        name: record.name,
        company: record.company,
        role: record.role || "",
        phone: record.phone,
        createdAt: record.created_at,
        syncStatus: "synced",
        syncedAt:
          record.synced_at || new Date().toISOString(),
      }));

    await importSyncedParticipants(participants);

    // Registros processados, não necessariamente inseridos.
    imported += participants.length;

    offset += records.length;

    if (records.length < PAGE_SIZE) {
      break;
    }
  }

  return imported;
}

/**
 * ==================================================
 * EXECUTAR SINCRONIZAÇÃO
 * ==================================================
 *
 * 1. Verifica a conexão e a autenticação.
 * 2. Envia os cadastros pendentes.
 * 3. Confirma os cadastros aceitos.
 * 4. Remove localmente os rejeitados definitivamente.
 * 5. Importa os participantes válidos do Supabase.
 *
 * Falhas temporárias preservam os registros pendentes.
 */
async function executeSynchronization(): Promise<SyncSummary> {
  const summary = createEmptySummary();

  if (!isOnline()) {
    return summary;
  }

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      console.info(
        "[GF Sync] Dispositivo não autenticado."
      );

      return summary;
    }

    /**
     * ==============================================
     * ETAPA 1 — ENVIAR CADASTROS PENDENTES
     * ==============================================
     */
    const pending = await getPendingParticipants();

    for (const participant of pending) {
      try {
        const { data, error } = await supabase.rpc(
          "sync_participant",
          {
            p_id: participant.id,
            p_name: participant.name,
            p_company: participant.company,
            p_role: participant.role,
            p_phone: participant.phone,
            p_created_at: participant.createdAt,
          }
        );

        if (error) {
          console.warn(
            "[GF Sync] Falha de comunicação:",
            error.message
          );

          // Preserva o cadastro para uma nova tentativa.
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

          console.info(
            "[GF Sync] Cadastro confirmado:",
            participant.id
          );
        } else if (response?.status === "conflict") {
          const reason = response.reason;

          if (
            reason === "duplicate_phone" ||
            reason === "company_limit"
          ) {
            /**
             * O Supabase confirmou que este cadastro
             * não pode ser aceito.
             *
             * Remove somente o registro local rejeitado.
             * Não altera os demais participantes.
             */
            await removeRejectedParticipant(
              participant.id
            );

            summary.conflicts++;

            console.info(
              "[GF Sync] Cadastro rejeitado removido:",
              participant.id,
              reason
            );
          } else {
            console.warn(
              "[GF Sync] Conflito não reconhecido:",
              response
            );
          }
        } else {
          console.warn(
            "[GF Sync] Cadastro permanece pendente:",
            response
          );
        }
      } catch (error) {
        /**
         * Um erro individual não interrompe
         * a sincronização dos demais participantes.
         */
        console.warn(
          "[GF Sync] Erro ao sincronizar participante:",
          error
        );
      }
    }

    /**
     * ==============================================
     * ETAPA 2 — RECEBER CADASTROS DO SUPABASE
     * ==============================================
     */
    try {
      summary.imported =
        await downloadCloudParticipants();

      console.info(
        "[GF Sync] Registros recebidos da nuvem:",
        summary.imported
      );
    } catch (error) {
      console.warn(
        "[GF Sync] Falha ao baixar participantes:",
        error
      );
    }

    summary.pending =
      (await getPendingParticipants()).length;

    return summary;
  } catch (error) {
    console.warn(
      "[GF Sync] Sincronização não concluída:",
      error
    );

    return summary;
  }
}

/**
 * ==================================================
 * SINCRONIZAÇÃO COMPARTILHADA
 * ==================================================
 *
 * Evita operações simultâneas.
 *
 * As chamadas adicionais aguardam a sincronização
 * que já está em andamento.
 */
export function syncPendingParticipants(): Promise<SyncSummary> {
  if (currentSyncPromise) {
    return currentSyncPromise;
  }

  const operation = executeSynchronization();

  currentSyncPromise = operation;

  void operation.finally(() => {
    if (currentSyncPromise === operation) {
      currentSyncPromise = null;
    }
  });

  return operation;
}
