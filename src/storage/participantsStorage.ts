/**
 * ==============================================================================
 * Camada de Acesso a Dados de Participantes
 * Encaminha as operações para o banco local (SQLite nativo no Android ou IndexedDB na Web)
 * ==============================================================================
 */

import { getDatabaseService } from "../database/databaseService";
import type {
  ConflictReason,
  ParticipantInput,
  StoredParticipant,
  SyncStatus,
} from "../database/types";

export type {
  ConflictReason,
  ParticipantInput,
  StoredParticipant,
  SyncStatus,
};

/**
 * Retorna todos os participantes cadastrados localmente.
 */
export async function getParticipants(): Promise<StoredParticipant[]> {
  const db = getDatabaseService();
  return db.getParticipants();
}

/**
 * Verifica se um telefone já está cadastrado no banco local.
 */
export async function participantPhoneExists(phone: string): Promise<boolean> {
  const db = getDatabaseService();
  return db.participantPhoneExists(phone);
}

/**
 * Retorna a quantidade de participantes cadastrados para a empresa especificada.
 */
export async function getCompanyParticipantCount(company: string): Promise<number> {
  const db = getDatabaseService();
  return db.getCompanyParticipantCount(company);
}

/**
 * Salva um novo participante com validação de telefone único e limite de 3 por empresa.
 */
export async function saveParticipant(
  participant: ParticipantInput
): Promise<StoredParticipant> {
  const db = getDatabaseService();
  return db.saveParticipant(participant);
}

/**
 * Atualiza o status de sincronização de um participante.
 */
export async function updateParticipantSyncStatus(
  id: string,
  syncStatus: SyncStatus,
  conflictReason?: ConflictReason,
  syncedAt?: string
): Promise<void> {
  const db = getDatabaseService();
  return db.updateParticipantSyncStatus(id, syncStatus, conflictReason, syncedAt);
}

/**
 * Retorna os participantes pendentes de sincronização com o Supabase.
 */
export async function getPendingParticipants(): Promise<StoredParticipant[]> {
  const db = getDatabaseService();
  return db.getPendingParticipants();
}

/**
 * Limpa todos os participantes locais (utilizado para reset).
 */
export async function clearAllParticipants(): Promise<void> {
  const db = getDatabaseService();
  return db.clearAllParticipants();
}