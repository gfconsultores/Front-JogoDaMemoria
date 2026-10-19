import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import * as XLSX from "xlsx";

import {
  getParticipants,
  type StoredParticipant,
} from "../storage/participantsStorage";

/**
 * Interface do plugin nativo de salvamento com Storage Access Framework (SAF).
 */
interface NativeFileSavePlugin {
  saveFile(options: {
    fileName: string;
    mimeType: string;
    data: string;
  }): Promise<{ status: "SUCCESS" | "CANCELLED"; uri?: string }>;
}

const FileSave = registerPlugin<NativeFileSavePlugin>("FileSavePlugin");

export type ExportStatus =
  | "DOWNLOAD_COMPLETED"  // Download direto no navegador ou salvo no dispositivo via SAF
  | "SHARE_OPENED"       // Menu nativo de compartilhamento aberto no Android
  | "CANCELLED"          // Usuário cancelou o SAF ou fechou o menu de compartilhamento
  | "NO_DATA"            // Não há participantes cadastrados
  | "ERROR";             // Erro técnico

export interface ExportResult {
  success: boolean;
  status: ExportStatus;
  error?: string;
}

/**
 * Formata o telefone para exibição no Excel.
 */
function formatPhone(phone: string): string {
  const numbers = phone.replace(/\D/g, "");

  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      7
    )}-${numbers.slice(7)}`;
  }

  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      6
    )}-${numbers.slice(6)}`;
  }

  return phone;
}

/**
 * Normaliza o nome da empresa para evitar
 * diferenças apenas por espaços ou letras
 * maiúsculas/minúsculas no resumo.
 */
function normalizeCompany(company: string): string {
  return company.trim().toLocaleLowerCase("pt-BR");
}

/**
 * Gera o nome do arquivo utilizando a data atual.
 *
 * Exemplo:
 * participantes-desafio-gf-26-09-2026.xlsx
 */
function createFileName(): string {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(
    2,
    "0"
  );
  const year = now.getFullYear();

  return `participantes-desafio-gf-${day}-${month}-${year}.xlsx`;
}

/**
 * Cria os dados da aba de participantes.
 */
function createParticipantsData(
  participants: StoredParticipant[]
) {
  return participants.map((participant, index) => ({
    Nº: index + 1,
    Nome: participant.name,
    Empresa: participant.company,
    Cargo: participant.role,
    Telefone: formatPhone(participant.phone),
  }));
}

/**
 * Cria o resumo da quantidade de participantes
 * por empresa.
 */
function createCompanySummary(
  participants: StoredParticipant[]
) {
  const companies = new Map<
    string,
    {
      company: string;
      participants: number;
    }
  >();

  participants.forEach((participant) => {
    const companyName = participant.company.trim();

    const key = normalizeCompany(companyName);

    const existingCompany = companies.get(key);

    if (existingCompany) {
      existingCompany.participants += 1;

      return;
    }

    companies.set(key, {
      company: companyName,
      participants: 1,
    });
  });

  return Array.from(companies.values()).sort((a, b) =>
    a.company.localeCompare(b.company, "pt-BR")
  );
}

/**
 * Constrói a planilha com as abas "Participantes" e "Resumo".
 */
function buildWorkbook(participants: StoredParticipant[]): XLSX.WorkBook {
  const participantsData = createParticipantsData(participants);
  const participantsSheet = XLSX.utils.json_to_sheet(participantsData);

  participantsSheet["!cols"] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 32 },
    { wch: 26 },
    { wch: 20 },
  ];

  const companySummary = createCompanySummary(participants);
  const totalCompanies = companySummary.length;

  const summaryData: (string | number)[][] = [
    ["RESUMO - DESAFIO GF"],
    [],
    ["Total de participantes", participants.length],
    ["Total de empresas", totalCompanies],
    [],
    ["PARTICIPANTES POR EMPRESA"],
    ["Empresa", "Quantidade"],
  ];

  companySummary.forEach((item) => {
    summaryData.push([item.company, item.participants]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [
    { wch: 38 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, participantsSheet, "Participantes");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");

  return workbook;
}

/**
 * 1. BAIXAR PLANILHA
 * - Navegador Web: download direto tradicional.
 * - Android (APK): abre Storage Access Framework (SAF) para o operador escolher a pasta de destino.
 */
export async function downloadParticipantsExcel(): Promise<ExportResult> {
  const participants = await getParticipants();

  if (participants.length === 0) {
    return {
      success: false,
      status: "NO_DATA",
    };
  }

  try {
    const fileName = createFileName();
    const workbook = buildWorkbook(participants);

    if (Capacitor.isNativePlatform()) {
      const base64Data = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      const result = await FileSave.saveFile({
        fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        data: base64Data,
      });

      if (result.status === "CANCELLED") {
        return {
          success: false,
          status: "CANCELLED",
        };
      }

      return {
        success: true,
        status: "DOWNLOAD_COMPLETED",
      };
    }

    // Fluxo Web
    XLSX.writeFile(workbook, fileName);
    return {
      success: true,
      status: "DOWNLOAD_COMPLETED",
    };
  } catch (err) {
    console.error("Erro ao salvar planilha:", err);
    return {
      success: false,
      status: "ERROR",
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

/**
 * 2. COMPARTILHAR PLANILHA
 * - Android (APK): gera arquivo no cache e abre o menu nativo de compartilhamento.
 * - Navegador Web: fallback seguro disparando o download.
 */
export async function shareParticipantsExcel(): Promise<ExportResult> {
  const participants = await getParticipants();

  if (participants.length === 0) {
    return {
      success: false,
      status: "NO_DATA",
    };
  }

  try {
    const fileName = createFileName();
    const workbook = buildWorkbook(participants);

    if (Capacitor.isNativePlatform()) {
      const base64Data = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      try {
        await Share.share({
          title: fileName,
          text: "Relatório de participantes do Desafio GF",
          files: [fileResult.uri],
          dialogTitle: "Compartilhar planilha Excel",
        });

        return {
          success: true,
          status: "SHARE_OPENED",
        };
      } catch (shareErr: unknown) {
        const msg =
          shareErr instanceof Error
            ? shareErr.message.toLowerCase()
            : String(shareErr).toLowerCase();

        if (
          msg.includes("cancel") ||
          msg.includes("dismiss") ||
          msg.includes("closed")
        ) {
          return {
            success: false,
            status: "CANCELLED",
          };
        }

        throw shareErr;
      }
    }

    // Fallback Web se acionado em navegador
    XLSX.writeFile(workbook, fileName);
    return {
      success: true,
      status: "DOWNLOAD_COMPLETED",
    };
  } catch (err) {
    console.error("Erro ao compartilhar planilha:", err);
    return {
      success: false,
      status: "ERROR",
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}