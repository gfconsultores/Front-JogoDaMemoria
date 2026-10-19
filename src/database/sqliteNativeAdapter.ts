
/**
 * ==============================================================================
 * Adaptador SQLite Nativo (Android / iOS)
 * Utiliza @capacitor-community/sqlite
 * ==============================================================================
 */

import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

import type {
  ConflictReason,
  IDatabaseService,
  ParticipantInput,
  StoredParticipant,
  SyncStatus,
} from "./types";

const DB_NAME = "gf_memory_game";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeCompany(company: string): string {
  return company
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export class SqliteNativeAdapter implements IDatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  /**
   * Impede inicializações simultâneas do SQLite.
   */
  private initializationPromise: Promise<void> | null = null;

  /**
   * ==================================================
   * INICIALIZAÇÃO DO BANCO DE DADOS
   * ==================================================
   */
  public async init(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeDatabase();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Executa a inicialização efetiva do SQLite.
   */
  private async initializeDatabase(): Promise<void> {
    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      const isConn = await this.sqlite.isConnection(
        DB_NAME,
        false
      );

      if (isConn.result) {
        this.db = await this.sqlite.retrieveConnection(
          DB_NAME,
          false
        );
      } else {
        this.db = await this.sqlite.createConnection(
          DB_NAME,
          false,
          "no-encryption",
          1,
          false
        );
      }

      const isOpen = await this.db.isDBOpen();

      if (!isOpen.result) {
        await this.db.open();
      }

      await this.createSchema();

      this.isInitialized = true;
    } catch (error) {
      console.error(
        "[SQLiteNativeAdapter] Erro ao inicializar banco nativo:",
        error
      );

      throw error;
    }
  }

  /**
   * ==================================================
   * CRIAÇÃO DA ESTRUTURA DO BANCO
   * ==================================================
   */
  private async createSchema(): Promise<void> {
    if (!this.db) {
      throw new Error(
        "Conexão com SQLite não disponível."
      );
    }

    const schemaQuery = `
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        normalized_company TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        conflict_reason TEXT,
        synced_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_participants_phone
      ON participants(phone);

      CREATE INDEX IF NOT EXISTS idx_participants_company
      ON participants(normalized_company);

      CREATE INDEX IF NOT EXISTS idx_participants_sync
      ON participants(sync_status);
    `;

    await this.db.execute(schemaQuery, false);
  }

  /**
   * ==================================================
   * CONSULTAR TODOS OS PARTICIPANTES
   * ==================================================
   */
  public async getParticipants(): Promise<StoredParticipant[]> {
    await this.init();

    if (!this.db) {
      return [];
    }

    const res = await this.db.query(
      `SELECT
        id,
        name,
        company,
        role,
        phone,
        created_at,
        sync_status,
        conflict_reason,
        synced_at
      FROM participants
      ORDER BY created_at ASC;`
    );

    if (!res.values) {
      return [];
    }

    return res.values.map(
      (row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        company: String(row.company),
        role: String(row.role || ""),
        phone: String(row.phone),
        createdAt: String(row.created_at),
        syncStatus:
          (row.sync_status as SyncStatus) || "pending",
        conflictReason: row.conflict_reason
          ? (row.conflict_reason as ConflictReason)
          : undefined,
        syncedAt: row.synced_at
          ? String(row.synced_at)
          : undefined,
      })
    );
  }

  /**
   * ==================================================
   * VERIFICAR TELEFONE CADASTRADO
   * ==================================================
   */
  public async participantPhoneExists(
    phone: string
  ): Promise<boolean> {
    await this.init();

    if (!this.db) {
      return false;
    }

    const normalized = normalizePhone(phone);

    const res = await this.db.query(
      "SELECT id FROM participants WHERE phone = ? LIMIT 1;",
      [normalized]
    );

    return !!(
      res.values &&
      res.values.length > 0
    );
  }

  /**
   * ==================================================
   * CONTAR PARTICIPANTES POR EMPRESA
   * ==================================================
   */
  public async getCompanyParticipantCount(
    company: string
  ): Promise<number> {
    await this.init();

    if (!this.db) {
      return 0;
    }

    const normalized = normalizeCompany(company);

    const res = await this.db.query(
      `SELECT COUNT(*) as count
       FROM participants
       WHERE normalized_company = ?;`,
      [normalized]
    );

    if (!res.values || res.values.length === 0) {
      return 0;
    }

    return Number(res.values[0].count) || 0;
  }

  /**
   * ==================================================
   * SALVAR NOVO PARTICIPANTE
   * ==================================================
   */
  public async saveParticipant(
    input: ParticipantInput
  ): Promise<StoredParticipant> {
    await this.init();

    if (!this.db) {
      throw new Error(
        "Banco de dados SQLite não disponível."
      );
    }

    const cleanName = input.name.trim();

    const cleanCompany = input.company
      .trim()
      .replace(/\s+/g, " ");

    const cleanRole = input.role
      .trim()
      .replace(/\s+/g, " ");

    const cleanPhone = normalizePhone(input.phone);

    const normalizedCompany = normalizeCompany(
      input.company
    );

    /**
     * Verifica se o telefone já existe.
     */
    const phoneExists =
      await this.participantPhoneExists(cleanPhone);

    if (phoneExists) {
      throw new Error(
        "PARTICIPANT_ALREADY_EXISTS"
      );
    }

    /**
     * Verifica o limite de três participantes
     * por empresa no banco local.
     */
    const companyCount =
      await this.getCompanyParticipantCount(
        cleanCompany
      );

    if (companyCount >= 3) {
      throw new Error(
        "COMPANY_LIMIT_REACHED"
      );
    }

    const id = crypto.randomUUID();

    const createdAt = new Date().toISOString();

    const syncStatus: SyncStatus = "pending";

    const insertQuery = `
      INSERT INTO participants (
        id,
        name,
        company,
        normalized_company,
        role,
        phone,
        created_at,
        sync_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;

    await this.db.run(
      insertQuery,
      [
        id,
        cleanName,
        cleanCompany,
        normalizedCompany,
        cleanRole,
        cleanPhone,
        createdAt,
        syncStatus,
      ],
      true
    );

    return {
      id,
      name: cleanName,
      company: cleanCompany,
      role: cleanRole,
      phone: cleanPhone,
      createdAt,
      syncStatus,
    };
  }

  /**
   * ==================================================
   * ATUALIZAR STATUS DE SINCRONIZAÇÃO
   * ==================================================
   */
  public async updateParticipantSyncStatus(
    id: string,
    syncStatus: SyncStatus,
    conflictReason?: ConflictReason,
    syncedAt?: string
  ): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    const query = `
      UPDATE participants
      SET
        sync_status = ?,
        conflict_reason = ?,
        synced_at = ?
      WHERE id = ?;
    `;

    await this.db.run(
      query,
      [
        syncStatus,
        conflictReason || null,
        syncedAt || null,
        id,
      ],
      true
    );
  }

  /**
   * ==================================================
   * CONSULTAR PARTICIPANTES PENDENTES
   * ==================================================
   */
  public async getPendingParticipants(): Promise<
    StoredParticipant[]
  > {
    await this.init();

    if (!this.db) {
      return [];
    }

    const res = await this.db.query(
      `SELECT
        id,
        name,
        company,
        role,
        phone,
        created_at,
        sync_status,
        conflict_reason,
        synced_at
      FROM participants
      WHERE sync_status = 'pending'
      ORDER BY created_at ASC;`
    );

    if (!res.values) {
      return [];
    }

    return res.values.map(
      (row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        company: String(row.company),
        role: String(row.role || ""),
        phone: String(row.phone),
        createdAt: String(row.created_at),
        syncStatus:
          (row.sync_status as SyncStatus) || "pending",
        conflictReason: row.conflict_reason
          ? (row.conflict_reason as ConflictReason)
          : undefined,
        syncedAt: row.synced_at
          ? String(row.synced_at)
          : undefined,
      })
    );
  }

  /**
   * ==================================================
   * EXCLUIR PARTICIPANTE INDIVIDUALMENTE
   * ==================================================
   *
   * Remove apenas o participante correspondente ao ID.
   *
   * Esta função exclui somente do banco SQLite local.
   * A autorização administrativa e a exclusão no
   * Supabase serão realizadas por um serviço separado.
   */
  public async deleteParticipant(
    id: string
  ): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error(
        "Banco de dados SQLite não disponível."
      );
    }

    if (!id || !id.trim()) {
      throw new Error(
        "ID do participante não informado."
      );
    }

    await this.db.run(
      "DELETE FROM participants WHERE id = ?;",
      [id],
      true
    );
  }

  /**
   * ==================================================
   * LIMPAR TODOS OS PARTICIPANTES LOCAIS
   * ==================================================
   */
  public async clearAllParticipants(): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    await this.db.execute(
      "DELETE FROM participants;",
      false
    );
  }
}
