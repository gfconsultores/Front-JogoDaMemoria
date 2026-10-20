
/**
 * ==============================================================================
 * Tipos e Interfaces do Banco de Dados Local
 * ==============================================================================
 */

export type SyncStatus = "pending" | "synced" | "conflict";

export type ConflictReason =
  | "duplicate_phone"
  | "company_limit"
  | "server_error";

export interface StoredParticipant {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  createdAt: string;
  syncStatus: SyncStatus;
  conflictReason?: ConflictReason;
  syncedAt?: string;
}

export interface ParticipantInput {
  name: string;
  company: string;
  role: string;
  phone: string;
}

export interface IDatabaseService {
  init(): Promise<void>;

  getParticipants(): Promise<StoredParticipant[]>;

  participantPhoneExists(phone: string): Promise<boolean>;

  getCompanyParticipantCount(company: string): Promise<number>;

  saveParticipant(input: ParticipantInput): Promise<StoredParticipant>;

  updateParticipantSyncStatus(
    id: string,
    syncStatus: SyncStatus,
    conflictReason?: ConflictReason,
    syncedAt?: string
  ): Promise<void>;

  getPendingParticipants(): Promise<StoredParticipant[]>;

  /**
   * Importa participantes recebidos do Supabase
   * para o banco de dados local.
   *
   * A implementação deverá:
   * - Preservar os IDs originais.
   * - Evitar duplicidades por ID ou telefone.
   * - Não sobrescrever registros locais pendentes.
   * - Identificar conflitos sem interromper a importação.
   * - Registrar os participantes importados como sincronizados.
   */
  importSyncedParticipants(
    participants: StoredParticipant[]
  ): Promise<void>;

  /**
   * Exclui individualmente um participante do banco local.
   * A autorização e a exclusão no Supabase serão
   * tratadas por uma camada de serviço separada.
   */
  deleteParticipant(id: string): Promise<void>;

  clearAllParticipants(): Promise<void>;
}
