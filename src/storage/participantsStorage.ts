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
 * Retorna todos os participantes
 * armazenados no dispositivo.
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
 * Salva um novo participante.
 */
export function saveParticipant(participant: {
  name: string;
  company: string;
  phone: string;
}): StoredParticipant {
  const participants = getParticipants();

  const newParticipant: StoredParticipant = {
    id: crypto.randomUUID(),

    name: participant.name,
    company: participant.company,
    phone: participant.phone,

    levelReached: null,

    result: "playing",

    createdAt: new Date().toISOString(),
  };

  participants.push(newParticipant);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(participants)
  );

  return newParticipant;
}

/**
 * Atualiza o resultado de um participante
 * depois que a partida terminar.
 */
export function updateParticipantResult(
  phone: string,
  levelReached: number,
  result: "lost" | "winner"
): void {
  const participants = getParticipants();

  const updatedParticipants =
    participants.map((participant) => {
      if (participant.phone !== phone) {
        return participant;
      }

      return {
        ...participant,
        levelReached,
        result,
      };
    });

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedParticipants)
  );
}