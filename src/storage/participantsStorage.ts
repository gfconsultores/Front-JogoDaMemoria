/**
 * Estrutura de um participante salvo
 * localmente no dispositivo.
 */
export interface StoredParticipant {
  id: string;

  name: string;
  company: string;
  phone: string;

  levelReached: number | null;

  result:
    | "playing"
    | "lost"
    | "winner";

  createdAt: string;
}

const STORAGE_KEY =
  "gf-memory-game-participants";

/**
 * ==================================================
 * NORMALIZAR TELEFONE
 * ==================================================
 *
 * Remove qualquer caractere que não seja número.
 */
function normalizePhone(
  phone: string
): string {
  return phone.replace(/\D/g, "");
}

/**
 * ==================================================
 * NORMALIZAR EMPRESA
 * ==================================================
 *
 * Usado apenas para comparação.
 *
 * Exemplos considerados iguais:
 *
 * VIRTEX
 * Virtex
 * virtex
 * "  VIRTEX  "
 *
 * Também elimina espaços duplicados.
 */
function normalizeCompany(
  company: string
): string {
  return company
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

/**
 * ==================================================
 * RETORNAR PARTICIPANTES
 * ==================================================
 */
export function getParticipants(): StoredParticipant[] {
  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(
      data
    ) as StoredParticipant[];
  } catch {
    return [];
  }
}

/**
 * ==================================================
 * VERIFICAR TELEFONE CADASTRADO
 * ==================================================
 */
export function participantPhoneExists(
  phone: string
): boolean {
  const normalizedPhone =
    normalizePhone(phone);

  const participants =
    getParticipants();

  return participants.some(
    (participant) =>
      normalizePhone(
        participant.phone
      ) === normalizedPhone
  );
}

/**
 * ==================================================
 * CONTAR PARTICIPANTES DA EMPRESA
 * ==================================================
 *
 * Retorna quantos participantes já estão
 * cadastrados para determinada empresa.
 *
 * A comparação ignora:
 *
 * - Maiúsculas/minúsculas
 * - Espaços no início/final
 * - Espaços duplicados
 */
export function getCompanyParticipantCount(
  company: string
): number {
  const normalizedCompany =
    normalizeCompany(company);

  const participants =
    getParticipants();

  return participants.filter(
    (participant) =>
      normalizeCompany(
        participant.company
      ) === normalizedCompany
  ).length;
}

/**
 * ==================================================
 * SALVAR PARTICIPANTE
 * ==================================================
 */
export function saveParticipant(participant: {
  name: string;
  company: string;
  phone: string;
}): StoredParticipant {
  const participants =
    getParticipants();

  const normalizedPhone =
    normalizePhone(
      participant.phone
    );

  const phoneAlreadyExists =
    participants.some(
      (storedParticipant) =>
        normalizePhone(
          storedParticipant.phone
        ) === normalizedPhone
    );

  if (phoneAlreadyExists) {
    throw new Error(
      "PARTICIPANT_ALREADY_EXISTS"
    );
  }

  const newParticipant: StoredParticipant = {
    id: crypto.randomUUID(),

    name:
      participant.name.trim(),

    company:
      participant.company.trim(),

    phone:
      normalizedPhone,

    levelReached: null,

    result: "playing",

    createdAt:
      new Date().toISOString(),
  };

  participants.push(
    newParticipant
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      participants
    )
  );

  return newParticipant;
}

/**
 * ==================================================
 * EDITAR PARTICIPANTE
 * ==================================================
 *
 * Permite alterar:
 *
 * - Nome
 * - Empresa
 * - Telefone
 *
 * Preserva:
 *
 * - ID
 * - Data de cadastro
 * - Resultado
 * - Nível alcançado
 */
export function updateParticipant(
  id: string,
  data: {
    name: string;
    company: string;
    phone: string;
  }
): StoredParticipant {
  const participants =
    getParticipants();

  /**
   * Encontrar o participante pelo ID.
   */
  const participantIndex =
    participants.findIndex(
      (participant) =>
        participant.id === id
    );

  if (participantIndex === -1) {
    throw new Error(
      "PARTICIPANT_NOT_FOUND"
    );
  }

  const normalizedPhone =
    normalizePhone(
      data.phone
    );

  /**
   * Verificar se o novo telefone pertence
   * a OUTRO participante.
   *
   * O participante pode continuar utilizando
   * seu próprio telefone normalmente.
   */
  const phoneAlreadyExists =
    participants.some(
      (participant) =>
        participant.id !== id &&
        normalizePhone(
          participant.phone
        ) === normalizedPhone
    );

  if (phoneAlreadyExists) {
    throw new Error(
      "PARTICIPANT_ALREADY_EXISTS"
    );
  }

  /**
   * Criamos a versão atualizada mantendo
   * todos os demais dados originais.
   */
  const updatedParticipant: StoredParticipant = {
    ...participants[
      participantIndex
    ],

    name:
      data.name.trim(),

    company:
      data.company.trim(),

    phone:
      normalizedPhone,
  };

  participants[
    participantIndex
  ] = updatedParticipant;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      participants
    )
  );

  return updatedParticipant;
}

/**
 * ==================================================
 * ATUALIZAR RESULTADO
 * ==================================================
 */
export function updateParticipantResult(
  phone: string,
  levelReached: number,
  result: "lost" | "winner"
): void {
  const participants =
    getParticipants();

  const normalizedPhone =
    normalizePhone(phone);

  const updatedParticipants =
    participants.map(
      (participant) => {
        if (
          normalizePhone(
            participant.phone
          ) !== normalizedPhone
        ) {
          return participant;
        }

        return {
          ...participant,
          levelReached,
          result,
        };
      }
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      updatedParticipants
    )
  );
}