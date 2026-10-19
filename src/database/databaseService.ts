/**
 * ==============================================================================
 * Serviço Unificado de Banco de Dados
 * Seleciona SQLite Nativo no Android ou IndexedDB no Navegador (Vite Dev)
 * ==============================================================================
 */

import { Capacitor } from "@capacitor/core";
import { SqliteNativeAdapter } from "./sqliteNativeAdapter";
import { WebDatabaseAdapter } from "./webDatabaseAdapter";
import type { IDatabaseService } from "./types";

let adapterInstance: IDatabaseService | null = null;

export function getDatabaseService(): IDatabaseService {
  if (!adapterInstance) {
    if (Capacitor.isNativePlatform()) {
      adapterInstance = new SqliteNativeAdapter();
    } else {
      adapterInstance = new WebDatabaseAdapter();
    }
  }
  return adapterInstance;
}
