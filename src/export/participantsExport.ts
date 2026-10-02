import * as XLSX from "xlsx";

import {
  getParticipants,
  type StoredParticipant,
} from "../storage/participantsStorage";

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
 * Exporta todos os participantes cadastrados
 * para um arquivo Excel.
 */
export function exportParticipantsToExcel(): boolean {
  const participants = getParticipants();

  /**
   * Não gera arquivo vazio.
   */
  if (participants.length === 0) {
    return false;
  }

  /**
   * ==================================================
   * ABA PARTICIPANTES
   * ==================================================
   */

  const participantsData =
    createParticipantsData(participants);

  const participantsSheet =
    XLSX.utils.json_to_sheet(participantsData);

  /**
   * Largura das colunas.
   *
   * Nº | Nome | Empresa | Cargo | Telefone
   */
  participantsSheet["!cols"] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 32 },
    { wch: 26 },
    { wch: 20 },
  ];

  /**
   * ==================================================
   * ABA RESUMO
   * ==================================================
   */

  const companySummary =
    createCompanySummary(participants);

  const totalCompanies =
    companySummary.length;

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
    summaryData.push([
      item.company,
      item.participants,
    ]);
  });

  const summarySheet =
    XLSX.utils.aoa_to_sheet(summaryData);

  summarySheet["!cols"] = [
    { wch: 38 },
    { wch: 18 },
  ];

  /**
   * ==================================================
   * ARQUIVO EXCEL
   * ==================================================
   */

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    participantsSheet,
    "Participantes"
  );

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    "Resumo"
  );

  /**
   * Gera e baixa o arquivo.
   */
  XLSX.writeFile(
    workbook,
    createFileName()
  );

  return true;
}