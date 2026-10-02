/**
 * Estrutura de um participante salvo
 * localmente no dispositivo.
 */
export interface StoredParticipant {
  id: string;

  name: string;
  company: string;
  role: string;
  phone: string;

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
 *
 * Também mantém compatibilidade com participantes
 * cadastrados antes da criação do campo Cargo.
 */
export function getParticipants(): StoredParticipant[] {
  const data =
    localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    const participants =
      JSON.parse(data) as Array<
        Partial<StoredParticipant> & {
          id: string;
          name: string;
          company: string;
          phone: string;
          createdAt: string;
        }
      >;

    return participants.map(
      (participant) => ({
        id:
          participant.id,

        name:
          participant.name ?? "",

        company:
          participant.company ?? "",

        /**
         * Participantes antigos não possuem
         * Cargo. Nesse caso utilizamos uma
         * string vazia.
         */
        role:
          participant.role ?? "",

        phone:
          participant.phone ?? "",

        createdAt:
          participant.createdAt,
      })
    );
  } catch {
    return [];
  }
}

/**
 * ==================================================
 * VERIFICAR TELEFONE CADASTRADO
 * ==================================================
 *
 * Como cada participante possui direito
 * a apenas uma participação, a existência
 * do telefone no cadastro impede uma nova
 * tentativa.
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
 *
 * O participante é registrado antes
 * do início da partida.
 *
 * Não é armazenado resultado de vitória
 * ou derrota.
 */
export function saveParticipant(participant: {
  name: string;
  company: string;
  role: string;
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
      participant.company
        .trim()
        .replace(/\s+/g, " "),

    role:
      participant.role
        .trim()
        .replace(/\s+/g, " "),

    phone:
      normalizedPhone,

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
 * - Cargo
 * - Telefone
 *
 * Preserva:
 *
 * - ID
 * - Data de cadastro
 */
export function updateParticipant(
  id: string,
  data: {
    name: string;
    company: string;
    role: string;
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
   * os demais dados originais.
   */
  const updatedParticipant: StoredParticipant = {
    ...participants[
      participantIndex
    ],

    name:
      data.name.trim(),

    company:
      data.company
        .trim()
        .replace(/\s+/g, " "),

    role:
      data.role
        .trim()
        .replace(/\s+/g, " "),

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