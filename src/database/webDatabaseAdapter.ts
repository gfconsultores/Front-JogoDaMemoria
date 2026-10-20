
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
      const participant = request.result as
        | StoredParticipant
        | undefined;

      resolve(
        !!participant &&
        participant.syncStatus !== "conflict"
      );
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

    const request = index.getAll(
      IDBKeyRange.only(normalized)
    );

    request.onsuccess = () => {
      const participants =
        request.result as StoredParticipant[];

      const validCount = participants.filter(
        (participant) =>
          participant.syncStatus === "synced" ||
          participant.syncStatus === "pending"
      ).length;

      resolve(validCount);
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
   * ==================================================
   * IMPORTAR PARTICIPANTES DO SUPABASE
   * ==================================================
   *
   * Insere apenas participantes ainda não existentes
   * no banco local.
   *
   * Regras:
   * - Preserva os IDs originais do Supabase.
   * - Não sobrescreve registros existentes.
   * - Preserva registros pendentes e em conflito.
   * - Ignora telefones já cadastrados.
   * - Importa os novos registros como sincronizados.
   *
   * A reconciliação de exclusões será realizada
   * posteriormente pela camada de sincronização.
   */
  public async importSyncedParticipants(
    participants: StoredParticipant[]
  ): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB não disponível.");
    }

    const syncedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = tx.objectStore(STORE_NAME);
      const phoneIndex = store.index("phone");

      for (const participant of participants) {
        const id = participant.id?.trim();
        const cleanPhone = normalizePhone(
          participant.phone || ""
        );

        if (!id || !cleanPhone) {
          console.warn(
            "[GF IndexedDB] Participante ignorado: ID ou telefone inválido."
          );
          continue;
        }

        const cleanName = participant.name.trim();

        const cleanCompany = participant.company
          .trim()
          .replace(/\s+/g, " ");

        const cleanRole = (participant.role || "")
          .trim()
          .replace(/\s+/g, " ");

        const record = {
          id,
          name: cleanName,
          company: cleanCompany,
          normalizedCompany: normalizeCompany(
            cleanCompany
          ),
          role: cleanRole,
          phone: cleanPhone,
          createdAt: participant.createdAt,
          syncStatus: "synced" as SyncStatus,
          conflictReason: undefined,
          syncedAt: participant.syncedAt || syncedAt,
        };

        const idRequest = store.get(id);

        idRequest.onsuccess = () => {
          if (idRequest.result) {
            return;
          }

          const phoneRequest = phoneIndex.get(
            cleanPhone
          );

          phoneRequest.onsuccess = () => {
            if (phoneRequest.result) {
              return;
            }

            store.add(record);
          };
        };
      }

      tx.oncomplete = () => resolve();

      tx.onerror = () => {
        reject(
          tx.error ||
            new Error(
              "Erro ao importar participantes no IndexedDB."
            )
        );
      };

      tx.onabort = () => {
        reject(
          tx.error ||
            new Error(
              "Importação de participantes cancelada."
            )
        );
      };
    });
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
