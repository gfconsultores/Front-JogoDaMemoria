/**
 * ==============================================================================
 * Testes Automatizados Locais - Regras de Banco de Dados e Armazenamento Local
 * Executado diretamente pelo motor nativo de testes do Node.js 24 (node --test)
 * ==============================================================================
 */

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

/**
 * Funções de normalização idênticas às utilizadas em sqliteNativeAdapter e webDatabaseAdapter
 */
function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

function normalizeCompany(company) {
  return company
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

/**
 * Implementação real executando diretamente no motor C/C++ SQLite embutido no runtime
 * com o mesmo esquema de tabelas e comandos SQL do SqliteNativeAdapter do Android
 */
class RealSqliteDatabaseTestEngine {
  constructor() {
    // Banco em memória real SQLite C engine
    this.db = new DatabaseSync(":memory:");
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
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
      CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);
      CREATE INDEX IF NOT EXISTS idx_participants_company ON participants(normalized_company);
      CREATE INDEX IF NOT EXISTS idx_participants_sync ON participants(sync_status);
    `);
  }

  participantPhoneExists(phone) {
    const clean = normalizePhone(phone);
    const stmt = this.db.prepare("SELECT id FROM participants WHERE phone = ? LIMIT 1;");
    const row = stmt.get(clean);
    return !!row;
  }

  getCompanyParticipantCount(company) {
    const norm = normalizeCompany(company);
    const stmt = this.db.prepare("SELECT COUNT(*) as count FROM participants WHERE normalized_company = ?;");
    const row = stmt.get(norm);
    return row ? Number(row.count) : 0;
  }

  saveParticipant({ name, company, role, phone }) {
    const cleanName = name.trim();
    const cleanCompany = company.trim().replace(/\s+/g, " ");
    const cleanRole = role.trim().replace(/\s+/g, " ");
    const cleanPhone = normalizePhone(phone);
    const normalizedCompany = normalizeCompany(company);

    if (this.participantPhoneExists(cleanPhone)) {
      throw new Error("PARTICIPANT_ALREADY_EXISTS");
    }

    if (this.getCompanyParticipantCount(cleanCompany) >= 3) {
      throw new Error("COMPANY_LIMIT_REACHED");
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const syncStatus = "pending";

    const stmt = this.db.prepare(`
      INSERT INTO participants (
        id, name, company, normalized_company, role, phone, created_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(id, cleanName, cleanCompany, normalizedCompany, cleanRole, cleanPhone, createdAt, syncStatus);

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

  getParticipants() {
    const stmt = this.db.prepare(
      "SELECT id, name, company, role, phone, created_at, sync_status, conflict_reason, synced_at FROM participants ORDER BY created_at ASC;"
    );
    return stmt.all().map((r) => ({
      id: r.id,
      name: r.name,
      company: r.company,
      role: r.role,
      phone: r.phone,
      createdAt: r.created_at,
      syncStatus: r.sync_status,
      conflictReason: r.conflict_reason || undefined,
      syncedAt: r.synced_at || undefined,
    }));
  }

  getPendingParticipants() {
    const stmt = this.db.prepare(
      "SELECT id, name, company, role, phone, created_at, sync_status, conflict_reason, synced_at FROM participants WHERE sync_status = 'pending' ORDER BY created_at ASC;"
    );
    return stmt.all().map((r) => ({
      id: r.id,
      name: r.name,
      company: r.company,
      role: r.role,
      phone: r.phone,
      createdAt: r.created_at,
      syncStatus: r.sync_status,
      conflictReason: r.conflict_reason || undefined,
      syncedAt: r.synced_at || undefined,
    }));
  }

  updateParticipantSyncStatus(id, syncStatus, conflictReason = null, syncedAt = null) {
    const stmt = this.db.prepare(`
      UPDATE participants
      SET sync_status = ?, conflict_reason = ?, synced_at = ?
      WHERE id = ?;
    `);
    stmt.run(syncStatus, conflictReason, syncedAt, id);
  }
}

/**
 * ==============================================================================
 * BATERIA DE TESTES REAIS (Motor SQLite Oficial)
 * ==============================================================================
 */
describe("[REAL SQLite ENGINE] Regras de Negócio e Armazenamento Local", () => {
  let db;

  beforeEach(() => {
    db = new RealSqliteDatabaseTestEngine();
  });

  test("1. Cadastro inicial com sucesso e persistência de dados no SQLite", () => {
    const participant = db.saveParticipant({
      name: "João Silva",
      company: "GF Consultores",
      role: "Analista de Sistemas",
      phone: "(11) 98765-4321",
    });

    assert.ok(participant.id, "UUID deve ser gerado");
    assert.equal(participant.name, "João Silva");
    assert.equal(participant.company, "GF Consultores");
    assert.equal(participant.role, "Analista de Sistemas");
    assert.equal(participant.phone, "11987654321", "Telefone deve ser normalizado apenas para dígitos");
    assert.equal(participant.syncStatus, "pending", "Status inicial deve ser pending");

    const all = db.getParticipants();
    assert.equal(all.length, 1);
    assert.equal(all[0].id, participant.id);
  });

  test("2. Rejeição estrita de telefone duplicado (mesmo formato)", () => {
    db.saveParticipant({
      name: "Participante 1",
      company: "Empresa Alfa",
      role: "Diretor",
      phone: "11999990001",
    });

    assert.throws(
      () => {
        db.saveParticipant({
          name: "Participante 2",
          company: "Empresa Beta",
          role: "Gerente",
          phone: "11999990001",
        });
      },
      /PARTICIPANT_ALREADY_EXISTS/,
      "Deve rejeitar telefone já cadastrado"
    );

    const all = db.getParticipants();
    assert.equal(all.length, 1, "Apenas o primeiro participante deve estar gravado");
  });

  test("3. Rejeição de telefone duplicado com máscaras e formatações distintas", () => {
    db.saveParticipant({
      name: "Ana Costa",
      company: "Empresa Gama",
      role: "Consultora",
      phone: "(85) 98888-1234",
    });

    // Tentar cadastrar com formato sem máscara
    assert.throws(
      () => {
        db.saveParticipant({
          name: "Ana Outra",
          company: "Empresa Delta",
          role: "Coordenadora",
          phone: "85988881234",
        });
      },
      /PARTICIPANT_ALREADY_EXISTS/,
      "A normalização deve identificar números equivalentes independente de pontuação"
    );

    // Tentar cadastrar com espaços e traço
    assert.throws(
      () => {
        db.saveParticipant({
          name: "Ana Terceira",
          company: "Empresa Epsilon",
          role: "Analista",
          phone: " (85) 9 8888 1234 ",
        });
      },
      /PARTICIPANT_ALREADY_EXISTS/
    );
  });

  test("4. Limite de exatamente 3 participantes por empresa", () => {
    // 1º Participante
    db.saveParticipant({
      name: "P1",
      company: "Tech Solutions",
      role: "Dev 1",
      phone: "11911110001",
    });

    // 2º Participante
    db.saveParticipant({
      name: "P2",
      company: "Tech Solutions",
      role: "Dev 2",
      phone: "11911110002",
    });

    // 3º Participante
    db.saveParticipant({
      name: "P3",
      company: "Tech Solutions",
      role: "Dev 3",
      phone: "11911110003",
    });

    assert.equal(db.getCompanyParticipantCount("Tech Solutions"), 3);

    // 4º Participante da MESMA empresa deve ser bloqueado
    assert.throws(
      () => {
        db.saveParticipant({
          name: "P4",
          company: "Tech Solutions",
          role: "Dev 4",
          phone: "11911110004",
        });
      },
      /COMPANY_LIMIT_REACHED/,
      "Deve rejeitar o 4º participante de uma mesma empresa"
    );

    // Participante de OUTRA empresa deve ser permitido normalmente
    const other = db.saveParticipant({
      name: "P5",
      company: "Outra Empresa",
      role: "Gerente",
      phone: "11911110005",
    });
    assert.ok(other.id, "Empresa diferente deve poder cadastrar normalmente");
    assert.equal(db.getParticipants().length, 4);
  });

  test("5. Normalização avançada do nome da empresa (maiúsculas, minúsculas e espaços)", () => {
    // 1º com CamelCase
    db.saveParticipant({
      name: "Colaborador 1",
      company: "Virtex Telecom",
      role: "Cargo 1",
      phone: "11922220001",
    });

    // 2º com MAIÚSCULAS e espaços extras
    db.saveParticipant({
      name: "Colaborador 2",
      company: "   VIRTEX   TELECOM   ",
      role: "Cargo 2",
      phone: "11922220002",
    });

    // 3º com minúsculas
    db.saveParticipant({
      name: "Colaborador 3",
      company: "virtex telecom",
      role: "Cargo 3",
      phone: "11922220003",
    });

    assert.equal(
      db.getCompanyParticipantCount("VIRTEX TELECOM"),
      3,
      "Contagem deve unificar todas as variações"
    );

    // 4º cadastro deve ser rejeitado mesmo com variação de digitação
    assert.throws(
      () => {
        db.saveParticipant({
          name: "Colaborador 4",
          company: "Virtex   Telecom",
          role: "Cargo 4",
          phone: "11922220004",
        });
      },
      /COMPANY_LIMIT_REACHED/
    );
  });

  test("6. Persistência de estados de sincronização (pending, synced, conflict)", () => {
    const p1 = db.saveParticipant({
      name: "Marcos",
      company: "GF",
      role: "Consultor",
      phone: "11933330001",
    });

    const p2 = db.saveParticipant({
      name: "Luciana",
      company: "GF",
      role: "Diretora",
      phone: "11933330002",
    });

    assert.equal(db.getPendingParticipants().length, 2, "Inicialmente ambos devem estar pendentes");

    // Simula sincronização com sucesso para p1
    const syncTime = new Date().toISOString();
    db.updateParticipantSyncStatus(p1.id, "synced", null, syncTime);

    // Simula detecção de conflito na nuvem para p2 (ex: telefone já existente em outro totem)
    db.updateParticipantSyncStatus(p2.id, "conflict", "duplicate_phone", null);

    // Verifica fila de pendentes
    const pendingAfter = db.getPendingParticipants();
    assert.equal(pendingAfter.length, 0, "Nenhum participante deve restar na fila de pendentes");

    // Verifica histórico completo
    const all = db.getParticipants();
    const storedP1 = all.find((p) => p.id === p1.id);
    const storedP2 = all.find((p) => p.id === p2.id);

    assert.equal(storedP1.syncStatus, "synced");
    assert.equal(storedP1.syncedAt, syncTime);
    assert.equal(storedP1.conflictReason, undefined);

    assert.equal(storedP2.syncStatus, "conflict");
    assert.equal(storedP2.conflictReason, "duplicate_phone");
    assert.ok(storedP2.name === "Luciana", "Registro em conflito DEVE ser preservado localmente");
  });
});

/**
 * ==============================================================================
 * BATERIA DE TESTES SIMULADOS: WebDatabaseAdapter (IndexedDB / Ambiente Navegador)
 * IDENTIFICAÇÃO CLARA: TESTE SIMULADO
 * Simula a estrutura assíncrona de armazenamento de objetos do navegador (IndexedDB)
 * ==============================================================================
 */
class SimulatedWebDatabaseEngine {
  constructor() {
    this.store = new Map();
  }

  async participantPhoneExists(phone) {
    const clean = normalizePhone(phone);
    return Array.from(this.store.values()).some((p) => p.phone === clean);
  }

  async getCompanyParticipantCount(company) {
    const norm = normalizeCompany(company);
    return Array.from(this.store.values()).filter((p) => p.normalizedCompany === norm).length;
  }

  async saveParticipant({ name, company, role, phone }) {
    const cleanName = name.trim();
    const cleanCompany = company.trim().replace(/\s+/g, " ");
    const cleanRole = role.trim().replace(/\s+/g, " ");
    const cleanPhone = normalizePhone(phone);
    const normalizedCompany = normalizeCompany(company);

    if (await this.participantPhoneExists(cleanPhone)) {
      throw new Error("PARTICIPANT_ALREADY_EXISTS");
    }

    if ((await this.getCompanyParticipantCount(cleanCompany)) >= 3) {
      throw new Error("COMPANY_LIMIT_REACHED");
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const syncStatus = "pending";

    const participant = {
      id,
      name: cleanName,
      company: cleanCompany,
      normalizedCompany,
      role: cleanRole,
      phone: cleanPhone,
      createdAt,
      syncStatus,
    };

    this.store.set(id, participant);

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

  async getParticipants() {
    return Array.from(this.store.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async getPendingParticipants() {
    const all = await this.getParticipants();
    return all.filter((p) => p.syncStatus === "pending");
  }

  async updateParticipantSyncStatus(id, syncStatus, conflictReason = undefined, syncedAt = undefined) {
    const item = this.store.get(id);
    if (!item) return;
    item.syncStatus = syncStatus;
    item.conflictReason = conflictReason;
    item.syncedAt = syncedAt;
  }
}

describe("[TESTE SIMULADO - ADAPTADOR WEB / INDEXEDDB] Regras de Negócio e Armazenamento", () => {
  let webDb;

  beforeEach(() => {
    webDb = new SimulatedWebDatabaseEngine();
  });

  test("1. [Simulado Web] Cadastro assíncrono e persistência no store", async () => {
    const p = await webDb.saveParticipant({
      name: "Mariana Silva",
      company: "GF Consultores",
      role: "Gerente",
      phone: "(11) 97777-6666",
    });

    assert.ok(p.id);
    assert.equal(p.phone, "11977776666");
    assert.equal(p.syncStatus, "pending");

    const all = await webDb.getParticipants();
    assert.equal(all.length, 1);
  });

  test("2. [Simulado Web] Rejeição de telefone duplicado", async () => {
    await webDb.saveParticipant({
      name: "P1",
      company: "Empresa 1",
      role: "Cargo",
      phone: "11999998888",
    });

    await assert.rejects(
      async () => {
        await webDb.saveParticipant({
          name: "P2",
          company: "Empresa 2",
          role: "Cargo",
          phone: " (11) 99999-8888 ",
        });
      },
      /PARTICIPANT_ALREADY_EXISTS/
    );
  });

  test("3. [Simulado Web] Limite estrito de 3 por empresa e normalização", async () => {
    await webDb.saveParticipant({ name: "P1", company: "Empresa Teste", role: "R1", phone: "11900000001" });
    await webDb.saveParticipant({ name: "P2", company: "  EMPRESA TESTE  ", role: "R2", phone: "11900000002" });
    await webDb.saveParticipant({ name: "P3", company: "empresa teste", role: "R3", phone: "11900000003" });

    assert.equal(await webDb.getCompanyParticipantCount("Empresa Teste"), 3);

    await assert.rejects(
      async () => {
        await webDb.saveParticipant({ name: "P4", company: "Empresa Teste", role: "R4", phone: "11900000004" });
      },
      /COMPANY_LIMIT_REACHED/
    );
  });

  test("4. [Simulado Web] Estados de sincronização e preservação de conflitos", async () => {
    const p1 = await webDb.saveParticipant({ name: "A", company: "X", role: "R", phone: "11912345678" });
    const p2 = await webDb.saveParticipant({ name: "B", company: "X", role: "R", phone: "11912345679" });

    assert.equal((await webDb.getPendingParticipants()).length, 2);

    await webDb.updateParticipantSyncStatus(p1.id, "synced", undefined, new Date().toISOString());
    await webDb.updateParticipantSyncStatus(p2.id, "conflict", "company_limit", undefined);

    assert.equal((await webDb.getPendingParticipants()).length, 0);

    const all = await webDb.getParticipants();
    assert.equal(all.find((p) => p.id === p1.id).syncStatus, "synced");
    assert.equal(all.find((p) => p.id === p2.id).syncStatus, "conflict");
    assert.equal(all.find((p) => p.id === p2.id).conflictReason, "company_limit");
  });
});

