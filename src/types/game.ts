/**
 * Define as estruturas de dados utilizadas
 * na logica do jogo da memoria.
 *
 * Este arquivo contem apenas tipos
 * relacionados diretamente a partida.
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
 * Configuracao de cada nivel.
 */
export interface LevelConfig {
  level: number;
  pairs: number;
  memorizeTime: number;
  playTime: number;
  maxErrors: number;
}


/**
 * Estado atual da partida.
 */
export interface GameState {
  level: number;
  errors: number;

  status:
    | "idle"
    | "instructions"
    | "countdown"
    | "memorizing"
    | "playing"
    | "levelComplete"
    | "gameOver";
}