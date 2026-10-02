import { useEffect, useState } from "react";

import { Card } from "../../components/Card/Card";
import { GameInfo } from "../../components/GameInfo/GameInfo";
import { Lives } from "../../components/Lives/Lives";
import { GameInstructions } from "../../components/GameInstructions/GameInstructions";
import { GameCountdown } from "../../components/GameCountdown/GameCountdown";
import { GameResultModal } from "../../components/GameResultModal/GameResultModal";

import { gameConfig } from "../../game/gameConfig";
import { shuffleArray } from "../../game/shuffle";

import {
  hasPlayerLost,
  isChallengeComplete,
  isPair,
} from "../../game/gameRules";

import type {
  GameState,
  MemoryCard,
} from "../../types/game";

import type { ParticipantData } from "../Registration/Registration";

import "./Game.css";

interface GameProps {
  participant: ParticipantData;
  onFinish: () => void;

  /**
   * Indica se a partida foi iniciada
   * pela Área Administrativa.
   */
  isAdmin?: boolean;

  /**
   * Volta para a Área Administrativa.
   * Utilizado somente antes da partida
   * e somente pelo administrador.
   */
  onBack?: () => void;
}

export function Game({
  participant,
  onFinish,
  isAdmin = false,
  onBack,
}: GameProps) {
  /**
   * Estado atual da partida.
   */
  const [gameState, setGameState] =
    useState<GameState>({
      errors: 0,
      status: "instructions",
    });

  /**
   * Cartas presentes no tabuleiro.
   */
  const [cards, setCards] =
    useState<MemoryCard[]>([]);

  /**
   * IDs das cartas atualmente selecionadas.
   */
  const [
    selectedCards,
    setSelectedCards,
  ] = useState<number[]>([]);

  /**
   * Impede novos cliques enquanto
   * duas cartas estão sendo verificadas.
   */
  const [isChecking, setIsChecking] =
    useState(false);

  /**
   * Tempo restante da etapa
   * de memorização.
   */
  const [
    memorizeSeconds,
    setMemorizeSeconds,
  ] = useState(0);

  /**
   * Tempo restante da partida.
   */
  const [
    playSeconds,
    setPlaySeconds,
  ] = useState(0);

  /**
   * Mensagem temporária exibida
   * após uma tentativa incorreta.
   */
  const [message, setMessage] =
    useState("");

  /**
   * Sai das instruções e inicia
   * a contagem 3, 2, 1, JÁ!
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
   * Prepara o Desafio GF.
   *
   * Este efeito é executado quando
   * o jogo entra na etapa de memorização.
   */
  useEffect(() => {
    if (
      gameState.status !== "memorizing"
    ) {
      return;
    }

    const newCards = createCards(
      gameConfig.pairs
    );

    setCards(newCards);
    setSelectedCards([]);
    setIsChecking(false);
    setMessage("");

    /**
     * Define os cronômetros iniciais.
     */
    setMemorizeSeconds(
      Math.ceil(
        gameConfig.memorizeTime / 1000
      )
    );

    setPlaySeconds(
      Math.ceil(
        gameConfig.playTime / 1000
      )
    );

    /**
     * Contagem regressiva da memorização.
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
     * Finaliza a etapa de memorização.
     */
    const timer = window.setTimeout(
      () => {
        window.clearInterval(
          countdown
        );

        setMemorizeSeconds(0);

        /**
         * Vira todas as cartas para baixo
         * ao terminar a memorização.
         */
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
         * Inicia a etapa principal
         * da partida.
         */
        setGameState(
          (previous) => ({
            ...previous,
            status: "playing",
          })
        );
      },
      gameConfig.memorizeTime
    );

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(countdown);
    };
  }, [gameState.status]);

  /**
   * Cronômetro do tempo disponível
   * para concluir o desafio.
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
   * Encerra a participação caso
   * o tempo da partida termine.
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
   * Remove automaticamente a mensagem
   * de erro depois de 1,5 segundo.
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
    /**
     * Cartas somente podem ser selecionadas
     * durante a etapa principal da partida.
     */
    if (
      gameState.status !== "playing"
    ) {
      return;
    }

    /**
     * Impede novos cliques enquanto
     * um par está sendo verificado.
     */
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

    /**
     * Não permite selecionar novamente
     * uma carta já virada.
     */
    if (clickedCard.isFlipped) {
      return;
    }

    /**
     * Não permite selecionar novamente
     * uma carta cujo par já foi encontrado.
     */
    if (clickedCard.isMatched) {
      return;
    }

    /**
     * Vira a carta selecionada.
     */
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

    /**
     * Quando duas cartas forem selecionadas,
     * verifica se formam um par.
     */
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
     *
     * A regra de comparação dos pares
     * fica centralizada em gameRules.ts.
     */
    if (
      isPair(
        firstCard,
        secondCard
      )
    ) {
      window.setTimeout(() => {
        setCards(
          (currentCards) => {
            const updatedCards =
              currentCards.map(
                (card) =>
                  card.id === firstId ||
                  card.id === secondId
                    ? {
                        ...card,
                        isFlipped: true,
                        isMatched: true,
                      }
                    : card
              );

            /**
             * Verifica através de gameRules.ts
             * se todos os pares do desafio
             * foram encontrados.
             */
            const challengeCompleted =
              isChallengeComplete(
                updatedCards
              );

            /**
             * Todos os pares encontrados:
             * Desafio GF concluído.
             */
            if (challengeCompleted) {
              setGameState(
                (previous) => {
                  /**
                   * Evita alterar o estado caso
                   * a partida já tenha terminado.
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
                      "challengeComplete",
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
      /**
       * Vira novamente para baixo
       * as duas cartas incorretas.
       */
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
          /**
           * Evita contabilizar erro caso
           * a partida já tenha terminado.
           */
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
              gameConfig.maxErrors -
                newErrors,
              0
            );

          /**
           * Verifica através de gameRules.ts
           * se o participante atingiu
           * o limite máximo de erros.
           */
          if (
            hasPlayerLost(
              newErrors,
              gameConfig.maxErrors
            )
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
           * mostra um aviso temporário.
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
   * O tabuleiro somente aparece
   * depois das instruções e
   * da contagem inicial.
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
          <GameInfo
            gameState={gameState}
          />

          {/**
           * Cronômetro da etapa
           * de memorização.
           */}
          {gameState.status ===
            "memorizing" && (
            <div className="memorize-timer">
              Memorize:{" "}
              {memorizeSeconds}s
            </div>
          )}

          {/**
           * Cronômetro da partida.
           */}
          {gameState.status ===
            "playing" && (
            <div className="play-timer">
              Tempo:{" "}
              {formatTime(
                playSeconds
              )}
            </div>
          )}

          {/**
           * Vidas disponíveis.
           */}
          <Lives
            errors={
              gameState.errors
            }
            maxErrors={
              gameConfig.maxErrors
            }
          />

          {/**
           * Mensagem temporária
           * após uma tentativa incorreta.
           */}
          {message && (
            <div className="game-message">
              {message}
            </div>
          )}

          {/**
           * Tabuleiro fixo do Desafio GF.
           *
           * O jogo possui 16 cartas
           * organizadas em uma grade 4 x 4.
           */}
          <div className="game-board">
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
       * Instruções iniciais.
       *
       * A opção de voltar aparece
       * somente no modo administrativo.
       */}
      {gameState.status ===
        "instructions" && (
        <GameInstructions
          onPlay={startCountdown}
          isAdmin={isAdmin}
          onBack={onBack}
        />
      )}

      {/**
       * Contagem:
       * 3, 2, 1, JÁ!
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
       * PARTICIPAÇÃO ENCERRADA
       *
       * O participante perdeu todas
       * as vidas ou ficou sem tempo.
       */}
      {gameState.status ===
        "gameOver" && (
        <GameResultModal
          participant={participant}
          completedGame={false}
          isAdmin={isAdmin}
          onFinish={onFinish}
        />
      )}

      {/**
       * DESAFIO CONCLUÍDO
       *
       * Todos os pares foram encontrados.
       */}
      {gameState.status ===
        "challengeComplete" && (
        <GameResultModal
          participant={participant}
          completedGame={true}
          isAdmin={isAdmin}
          onFinish={onFinish}
        />
      )}
    </main>
  );
}

/**
 * Cria os pares de cartas
 * e embaralha o tabuleiro.
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
 * Formata o tempo no padrão MM:SS.
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