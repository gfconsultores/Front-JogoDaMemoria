
/**
 * ==============================================================================
 * Adaptador de Banco de Dados para Desenvolvimento Web / Navegador
 * Utiliza IndexedDB estruturado com índices e constraints equivalentes ao SQLite.
 * Garante que 'npm run dev' funcione sem dependência de WASM ou componentes externos.
 * ==============================================================================
 */

import type {
  ConflictReason,
  IDatabaseService,
  ParticipantInput,
  StoredParticipant,
  SyncStatus,
} from "./types";

const DB_NAME = "gf_memory_game_web";
const STORE_NAME = "participants";
const DB_VERSION = 1;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeCompany(company: string): string {
  return company
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export class WebDatabaseAdapter implements IDatabaseService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });

          store.createIndex("phone", "phone", {
            unique: true,
          });

          store.createIndex(
            "normalizedCompany",
            "normalizedCompany",
            { unique: false }
          );

          store.createIndex("syncStatus", "syncStatus", {
            unique: false,
          });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error(
          "[WebDatabaseAdapter] Erro ao abrir IndexedDB:",
          event
        );

        reject(
          (event.target as IDBOpenDBRequest).error
        );
      };
    });

    return this.initPromise;
  }

  public async getParticipants(): Promise<StoredParticipant[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readonly"
      );

      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (
          request.result as Array<
            StoredParticipant & {
              normalizedCompany?: string;
            }
          >
        ).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );

        resolve(
          records.map((r) => ({
            id: r.id,
            name: r.name,
            company: r.company,
            role: r.role || "",
            phone: r.phone,
            createdAt: r.createdAt,
            syncStatus: r.syncStatus || "pending",
            conflictReason: r.conflictReason,
            syncedAt: r.syncedAt,
          }))
        );
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async participantPhoneExists(
    phone: string
  ): Promise<boolean> {
    await this.init();
    if (!this.db) return false;

    const normalized = normalizePhone(phone);

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readonly"
      );

      const store = tx.objectStore(STORE_NAME);
      const index = store.index("phone");
      const request = index.get(normalized);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async getCompanyParticipantCount(
    company: string
  ): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const normalized = normalizeCompany(company);

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readonly"
      );

      const store = tx.objectStore(STORE_NAME);
      const index = store.index("normalizedCompany");

      const request = index.count(
        IDBKeyRange.only(normalized)
      );

      request.onsuccess = () => {
        resolve(request.result || 0);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async saveParticipant(
    input: ParticipantInput
  ): Promise<StoredParticipant> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB não disponível.");
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

    const phoneExists =
      await this.participantPhoneExists(cleanPhone);

    if (phoneExists) {
      throw new Error("PARTICIPANT_ALREADY_EXISTS");
    }

    const companyCount =
      await this.getCompanyParticipantCount(cleanCompany);

    if (companyCount >= 3) {
      throw new Error("COMPANY_LIMIT_REACHED");
    }

    const newParticipant: StoredParticipant & {
      normalizedCompany: string;
    } = {
      id: crypto.randomUUID(),
      name: cleanName,
      company: cleanCompany,
      normalizedCompany,
      role: cleanRole,
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
      syncStatus: "pending",
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = tx.objectStore(STORE_NAME);
      const request = store.add(newParticipant);

      request.onsuccess = () => {
        resolve({
          id: newParticipant.id,
          name: newParticipant.name,
          company: newParticipant.company,
          role: newParticipant.role,
          phone: newParticipant.phone,
          createdAt: newParticipant.createdAt,
          syncStatus: newParticipant.syncStatus,
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async updateParticipantSyncStatus(
    id: string,
    syncStatus: SyncStatus,
    conflictReason?: ConflictReason,
    syncedAt?: string
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result;

        if (!item) {
          resolve();
          return;
        }

        item.syncStatus = syncStatus;
        item.conflictReason = conflictReason;
        item.syncedAt = syncedAt;

        const putReq = store.put(item);

        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  public async getPendingParticipants():
    Promise<StoredParticipant[]> {
    const all = await this.getParticipants();

    return all.filter(
      (p) => p.syncStatus === "pending"
    );
  }

  /**
   * ==============================================================================
   * EXCLUSÃO INDIVIDUAL DE PARTICIPANTE
   * ==============================================================================
   *
   * Remove somente o registro correspondente ao ID informado.
   *
   * Esta função atua exclusivamente no IndexedDB.
   *
   * A exclusão no Supabase e a autorização administrativa
   * serão realizadas por um serviço separado.
   *
   * Não utilizar diretamente na interface antes de
   * concluir a integração com o Supabase.
   */
  public async deleteParticipant(
    id: string
  ): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB não disponível.");
    }

    if (!id || !id.trim()) {
      throw new Error(
        "ID do participante não informado."
      );
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = tx.objectStore(STORE_NAME);
      store.delete(id);

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(
          tx.error ||
            new Error(
              "Erro ao excluir participante do IndexedDB."
            )
        );
      };

      tx.onabort = () => {
        reject(
          tx.error ||
            new Error(
              "Exclusão do participante cancelada."
            )
        );
      };
    });
  }

  /**
   * LIMPEZA COMPLETA DO BANCO LOCAL
   *
   * Mantida para compatibilidade com as rotinas existentes.
   */
  public async clearAllParticipants(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
