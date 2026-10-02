/**
 * Define as estruturas de dados utilizadas
 * na lógica do jogo da memória.
 *
 * Este arquivo contém apenas tipos
 * relacionados diretamente à partida.
 */

/**
 * Estrutura de uma carta do jogo.
 */
export interface MemoryCard {
  id: number;
  pairId: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

/**
 * Configuração única do Desafio GF.
 *
 * Como o jogo não possui mais níveis,
 * esta estrutura contém apenas as regras
 * necessárias para a partida.
 */
export interface GameConfig {
  pairs: number;
  memorizeTime: number;
  playTime: number;
  maxErrors: number;
}

/**
 * Estado atual da partida.
 */
export interface GameState {
  errors: number;

  status:
    | "idle"
    | "instructions"
    | "countdown"
    | "memorizing"
    | "playing"
    | "challengeComplete"
    | "gameOver";
}