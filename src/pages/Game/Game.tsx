import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { Card } from "../../components/Card/Card";
import { LevelInfo } from "../../components/LevelInfo/LevelInfo";
import { Lives } from "../../components/Lives/Lives";
import { GameModal } from "../../components/GameModal/GameModal";
import { GameInstructions } from "../../components/GameInstructions/GameInstructions";
import { GameCountdown } from "../../components/GameCountdown/GameCountdown";
import { GameResultModal } from "../../components/GameResultModal/GameResultModal";

import { levels } from "../../game/levels";
import { shuffleArray } from "../../game/shuffle";

import type {
  GameState,
  MemoryCard,
} from "../../types/game";

import type { ParticipantData } from "../Registration/Registration";

import "./Game.css";

/**
 * Nivel usado apenas durante o desenvolvimento.
 *
 * Altere este valor para testar diretamente
 * qualquer nivel do jogo.
 *
 * Antes da versao final, voltar para o nivel 1.
 */
const TEST_LEVEL = 4;

interface GameProps {
  participant: ParticipantData;
  onFinish: () => void;
}

export function Game({
  participant,
  onFinish,
}: GameProps) {
  const [gameState, setGameState] =
    useState<GameState>({
      level: TEST_LEVEL,
      errors: 0,
      status: "instructions",
    });

  /**
   * Identifica cada nova execucao do nivel.
   *
   * Utilizado principalmente durante
   * o desenvolvimento.
   */
  const [roundId] = useState(0);

  const levelConfig = levels.find(
    (config) =>
      config.level === gameState.level
  );

  const [cards, setCards] =
    useState<MemoryCard[]>([]);

  const [
    selectedCards,
    setSelectedCards,
  ] = useState<number[]>([]);

  const [isChecking, setIsChecking] =
    useState(false);

  const [
    memorizeSeconds,
    setMemorizeSeconds,
  ] = useState(0);

  const [
    playSeconds,
    setPlaySeconds,
  ] = useState(0);

  const [message, setMessage] =
    useState("");

  /**
   * Sai das instrucoes e inicia
   * a contagem 3, 2, 1, JA!
   */
  function startCountdown() {
    setGameState((previous) => ({
      ...previous,
      status: "countdown",
    }));
  }

  /**
   * Chamado pelo GameCountdown quando
   * a contagem inicial termina.
   */
  function startMemorization() {
    setGameState((previous) => ({
      ...previous,
      status: "memorizing",
    }));
  }

  /**
   * Prepara o nivel atual.
   *
   * Este efeito somente e executado
   * quando o jogo entra em "memorizing".
   */
  useEffect(() => {
    if (!levelConfig) {
      return;
    }

    if (
      gameState.status !== "memorizing"
    ) {
      return;
    }

    const newCards = createCards(
      levelConfig.pairs
    );

    setCards(newCards);
    setSelectedCards([]);
    setIsChecking(false);
    setMessage("");

    /**
     * Define os cronometros iniciais.
     */
    setMemorizeSeconds(
      Math.ceil(
        levelConfig.memorizeTime / 1000
      )
    );

    setPlaySeconds(
      Math.ceil(
        levelConfig.playTime / 1000
      )
    );

    /**
     * Contagem regressiva da memorizacao.
     */
    const countdown =
      window.setInterval(() => {
        setMemorizeSeconds(
          (previous) =>
            Math.max(
              previous - 1,
              0
            )
        );
      }, 1000);

    /**
     * Finaliza a etapa de memorizacao.
     */
    const timer = window.setTimeout(
      () => {
        window.clearInterval(
          countdown
        );

        setMemorizeSeconds(0);

        setCards(
          (currentCards) =>
            currentCards.map(
              (card) => ({
                ...card,
                isFlipped: false,
              })
            )
        );

        /**
         * Somente agora o tempo
         * da partida comeca.
         */
        setGameState(
          (previous) => ({
            ...previous,
            status: "playing",
          })
        );
      },
      levelConfig.memorizeTime
    );

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
    };
  }, [
    gameState.level,
    gameState.status,
    levelConfig,
    roundId,
  ]);

  /**
   * Cronometro do tempo disponivel
   * para jogar.
   */
  useEffect(() => {
    if (
      gameState.status !== "playing"
    ) {
      return;
    }

    const countdown =
      window.setInterval(() => {
        setPlaySeconds(
          (previous) =>
            Math.max(
              previous - 1,
              0
            )
        );
      }, 1000);

    return () => {
      window.clearInterval(countdown);
    };
  }, [gameState.status]);

  /**
   * Verifica se o tempo da partida acabou.
   */
  useEffect(() => {
    if (
      gameState.status === "playing" &&
      playSeconds === 0
    ) {
      setSelectedCards([]);
      setIsChecking(false);
      setMessage("");

      setGameState(
        (previous) => ({
          ...previous,
          status: "gameOver",
        })
      );
    }
  }, [
    playSeconds,
    gameState.status,
  ]);

  /**
   * Faz a mensagem de erro desaparecer
   * automaticamente depois de 1,5 segundo.
   */
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setMessage("");
      }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  /**
   * Clique em uma carta.
   */
  function handleCardClick(
    cardId: number
  ) {
    if (
      gameState.status !== "playing"
    ) {
      return;
    }

    if (isChecking) {
      return;
    }

    const clickedCard = cards.find(
      (card) =>
        card.id === cardId
    );

    if (!clickedCard) {
      return;
    }

    if (clickedCard.isFlipped) {
      return;
    }

    if (clickedCard.isMatched) {
      return;
    }

    setCards(
      (currentCards) =>
        currentCards.map(
          (card) =>
            card.id === cardId
              ? {
                  ...card,
                  isFlipped: true,
                }
              : card
        )
    );

    const newSelection = [
      ...selectedCards,
      cardId,
    ];

    setSelectedCards(newSelection);

    if (
      newSelection.length === 2
    ) {
      checkPair(newSelection);
    }
  }

  /**
   * Verifica as duas cartas selecionadas.
   */
  function checkPair(
    selection: number[]
  ) {
    const [
      firstId,
      secondId,
    ] = selection;

    const firstCard = cards.find(
      (card) =>
        card.id === firstId
    );

    const secondCard = cards.find(
      (card) =>
        card.id === secondId
    );

    if (
      !firstCard ||
      !secondCard
    ) {
      setSelectedCards([]);
      return;
    }

    setIsChecking(true);

    /**
     * ACERTO
     */
    if (
      firstCard.pairId ===
      secondCard.pairId
    ) {
      window.setTimeout(() => {
        setCards(
          (currentCards) => {
            const updatedCards =
              currentCards.map(
                (card) =>
                  card.id ===
                    firstId ||
                  card.id ===
                    secondId
                    ? {
                        ...card,
                        isFlipped:
                          true,
                        isMatched:
                          true,
                      }
                    : card
              );

            /**
             * Verifica se todos os pares
             * foram encontrados.
             */
            const levelCompleted =
              updatedCards.every(
                (card) =>
                  card.isMatched
              );

            if (levelCompleted) {
              setGameState(
                (previous) => {
                  /**
                   * Evita concluir o nivel
                   * depois de um Game Over.
                   */
                  if (
                    previous.status !==
                    "playing"
                  ) {
                    return previous;
                  }

                  return {
                    ...previous,
                    status:
                      "levelComplete",
                  };
                }
              );

              setMessage("");
            }

            return updatedCards;
          }
        );

        setSelectedCards([]);
        setIsChecking(false);
      }, 400);

      return;
    }

    /**
     * ERRO
     */
    window.setTimeout(() => {
      setCards(
        (currentCards) =>
          currentCards.map(
            (card) =>
              card.id === firstId ||
              card.id === secondId
                ? {
                    ...card,
                    isFlipped: false,
                  }
                : card
          )
      );

      setGameState(
        (previous) => {
          if (!levelConfig) {
            return previous;
          }

          if (
            previous.status !==
            "playing"
          ) {
            return previous;
          }

          const newErrors =
            previous.errors + 1;

          const remainingLives =
            Math.max(
              levelConfig.maxErrors -
                newErrors,
              0
            );

          /**
           * Ultima vida perdida.
           *
           * A participacao termina
           * definitivamente.
           */
          if (
            remainingLives === 0
          ) {
            setMessage("");

            return {
              ...previous,
              errors: newErrors,
              status: "gameOver",
            };
          }

          /**
           * Enquanto ainda houver vidas,
           * mostra um aviso temporario.
           */
          setMessage(
            `Não foi dessa vez! Preste atenção. Restam ${remainingLives} ${
              remainingLives === 1
                ? "vida"
                : "vidas"
            }.`
          );

          return {
            ...previous,
            errors: newErrors,
          };
        }
      );

      setSelectedCards([]);
      setIsChecking(false);
    }, 800);
  }

  /**
   * Avanca para o proximo nivel.
   *
   * As instrucoes iniciais nao aparecem
   * novamente entre os niveis.
   */
  function nextLevel() {
    const nextLevelNumber =
      gameState.level + 1;

    if (
      nextLevelNumber >
      levels.length
    ) {
      return;
    }

    setMessage("");
    setSelectedCards([]);
    setIsChecking(false);

    setGameState(
      (previous) => ({
        ...previous,
        level:
          nextLevelNumber,
        errors: 0,
        status: "memorizing",
      })
    );
  }

  /**
   * Caso exista algum problema
   * na configuracao do nivel.
   */
  if (!levelConfig) {
    return (
      <div>
        Configuração do nível não encontrada.
      </div>
    );
  }

  /**
   * Verifica se estamos no ultimo
   * nivel configurado no jogo.
   */
  const isLastLevel =
    gameState.level ===
    levels.length;

  /**
   * Quantidade total de cartas
   * do nivel atual.
   */
  const cardCount =
    cards.length;

  const boardColumns =
    getBoardColumns(cardCount);

  /**
   * O conteudo real da partida
   * somente aparece depois das
   * instrucoes e da contagem inicial.
   */
  const showGameContent =
    gameState.status !==
      "instructions" &&
    gameState.status !==
      "countdown";

  return (
    <main className="game">
      {showGameContent && (
        <>
          <LevelInfo
            gameState={gameState}
          />

          {gameState.status ===
            "memorizing" && (
            <div className="memorize-timer">
              Memorize:{" "}
              {memorizeSeconds}s
            </div>
          )}

          {gameState.status ===
            "playing" && (
            <div className="play-timer">
              Tempo:{" "}
              {formatTime(
                playSeconds
              )}
            </div>
          )}

          <Lives
            errors={
              gameState.errors
            }
            maxErrors={
              levelConfig.maxErrors
            }
          />

          {message && (
            <div className="game-message">
              {message}
            </div>
          )}

          <div
            className={`game-board game-board-${cardCount}`}
            style={
              {
                "--board-columns":
                  boardColumns,
              } as CSSProperties
            }
          >
            {cards.map(
              (card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={() =>
                    handleCardClick(
                      card.id
                    )
                  }
                />
              )
            )}
          </div>
        </>
      )}

      {/**
       * Instrucoes iniciais.
       */}
      {gameState.status ===
        "instructions" && (
        <GameInstructions
          onPlay={
            startCountdown
          }
        />
      )}

      {/**
       * Contagem 3, 2, 1, JA!
       */}
      {gameState.status ===
        "countdown" && (
        <GameCountdown
          onComplete={
            startMemorization
          }
        />
      )}

      {/**
       * DERROTA
       *
       * Qualquer derrota encerra
       * definitivamente a participacao.
       */}
      {gameState.status ===
        "gameOver" && (
        <GameResultModal
          participant={
            participant
          }
          level={
            gameState.level
          }
          completedGame={false}
          onFinish={
            onFinish
          }
        />
      )}

      {/**
       * NIVEL CONCLUIDO
       *
       * Nos niveis anteriores ao ultimo,
       * permite avancar normalmente.
       */}
      {gameState.status ===
        "levelComplete" &&
        !isLastLevel && (
          <GameModal
            type="levelComplete"
            level={
              gameState.level
            }
            isLastLevel={false}
            onRestart={() => {}}
            onNextLevel={
              nextLevel
            }
          />
        )}

      {/**
       * DESAFIO CONCLUIDO
       *
       * Ao concluir o ultimo nivel,
       * mostra o resultado final.
       */}
      {gameState.status ===
        "levelComplete" &&
        isLastLevel && (
          <GameResultModal
            participant={
              participant
            }
            level={
              gameState.level
            }
            completedGame={true}
            onFinish={
              onFinish
            }
          />
        )}
    </main>
  );
}

/**
 * Cria e embaralha os pares
 * de cartas do nivel.
 */
function createCards(
  numberOfPairs: number
): MemoryCard[] {
  const cards: MemoryCard[] = [];

  for (
    let pairId = 1;
    pairId <= numberOfPairs;
    pairId++
  ) {
    const image =
      `/images/card-${pairId}.jpg`;

    cards.push(
      {
        id: pairId * 2 - 1,
        pairId,
        image,
        isFlipped: true,
        isMatched: false,
      },
      {
        id: pairId * 2,
        pairId,
        image,
        isFlipped: true,
        isMatched: false,
      }
    );
  }

  return shuffleArray(cards);
}

/**
 * Formata o tempo da partida
 * no formato MM:SS.
 */
function formatTime(
  totalSeconds: number
): string {
  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${String(
    minutes
  ).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

/**
 * Define a quantidade de colunas
 * de acordo com a quantidade
 * de cartas do nivel.
 */
function getBoardColumns(
  cardCount: number
): number {
  switch (cardCount) {
    case 6:
      return 3;

    case 8:
      return 4;

    case 10:
      return 5;

    case 12:
      return 4;

    case 16:
      return 4;

    case 20:
      return 5;

    default:
      return 4;
  }
}