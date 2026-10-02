import { useEffect, useState } from "react";

import { Game } from "./pages/Game/Game";

import {
  Registration,
  type ParticipantData,
} from "./pages/Registration/Registration";

import { Participants } from "./pages/Participants/Participants";
import { Admin } from "./pages/Admin/Admin";

import {
  exportParticipantsToExcel,
} from "./export/participantsExport";

import "./App.css";

/**
 * Telas principais da aplicação.
 */
type AppScreen =
  | "registration"
  | "game"
  | "admin"
  | "participants";

/**
 * ==================================================
 * CHAVES DA SESSÃO
 * ==================================================
 *
 * O sessionStorage mantém os dados quando
 * a página é atualizada com F5.
 */
const SCREEN_KEY =
  "gf-memory-current-screen";

const PARTICIPANT_KEY =
  "gf-memory-current-participant";

const ADMIN_KEY =
  "gf-memory-admin-session";

const ADMIN_GAME_KEY =
  "gf-memory-admin-game";

/**
 * ==================================================
 * RECUPERAR TELA ATUAL
 * ==================================================
 */
function getInitialScreen(): AppScreen {
  const savedScreen =
    sessionStorage.getItem(SCREEN_KEY);

  if (
    savedScreen === "registration" ||
    savedScreen === "game" ||
    savedScreen === "admin" ||
    savedScreen === "participants"
  ) {
    return savedScreen;
  }

  return "registration";
}

/**
 * ==================================================
 * RECUPERAR PARTICIPANTE ATUAL
 * ==================================================
 */
function getInitialParticipant():
  | ParticipantData
  | null {
  const savedParticipant =
    sessionStorage.getItem(
      PARTICIPANT_KEY
    );

  if (!savedParticipant) {
    return null;
  }

  try {
    return JSON.parse(
      savedParticipant
    ) as ParticipantData;
  } catch {
    return null;
  }
}

/**
 * ==================================================
 * RECUPERAR SESSÃO ADMINISTRATIVA
 * ==================================================
 */
function getInitialAdminSession(): boolean {
  return (
    sessionStorage.getItem(
      ADMIN_KEY
    ) === "true"
  );
}

/**
 * ==================================================
 * RECUPERAR TIPO DA PARTIDA
 * ==================================================
 *
 * true:
 * partida iniciada pela Área Administrativa.
 *
 * false:
 * partida de um participante normal.
 */
function getInitialAdminGame(): boolean {
  return (
    sessionStorage.getItem(
      ADMIN_GAME_KEY
    ) === "true"
  );
}

function App() {
  /**
   * ==================================================
   * ESTADO PRINCIPAL
   * ==================================================
   */

  const [screen, setScreen] =
    useState<AppScreen>(
      getInitialScreen
    );

  /**
   * Participante atualmente jogando.
   *
   * Na partida administrativa usamos um participante
   * interno apenas para atender à estrutura atual do
   * componente Game.
   *
   * Ele NÃO é salvo na lista de participantes.
   */
  const [
    participant,
    setParticipant,
  ] =
    useState<ParticipantData | null>(
      getInitialParticipant
    );

  /**
   * ==================================================
   * SESSÃO ADMINISTRATIVA
   * ==================================================
   *
   * Indica exclusivamente se houve autenticação
   * administrativa.
   *
   * Não indica quem está jogando.
   */
  const [isAdmin, setIsAdmin] =
    useState<boolean>(
      getInitialAdminSession
    );

  /**
   * ==================================================
   * PARTIDA ADMINISTRATIVA
   * ==================================================
   *
   * Indica exclusivamente se o jogo atual foi
   * iniciado pela Equipe GF.
   */
  const [
    isAdminGame,
    setIsAdminGame,
  ] =
    useState<boolean>(
      getInitialAdminGame
    );

  /**
   * ==================================================
   * PERSISTÊNCIA DA TELA
   * ==================================================
   */

  useEffect(() => {
    sessionStorage.setItem(
      SCREEN_KEY,
      screen
    );
  }, [screen]);

  /**
   * ==================================================
   * PERSISTÊNCIA DO PARTICIPANTE
   * ==================================================
   */

  useEffect(() => {
    if (participant) {
      sessionStorage.setItem(
        PARTICIPANT_KEY,
        JSON.stringify(participant)
      );

      return;
    }

    sessionStorage.removeItem(
      PARTICIPANT_KEY
    );
  }, [participant]);

  /**
   * ==================================================
   * PERSISTÊNCIA DA SESSÃO ADMIN
   * ==================================================
   */

  useEffect(() => {
    if (isAdmin) {
      sessionStorage.setItem(
        ADMIN_KEY,
        "true"
      );

      return;
    }

    sessionStorage.removeItem(
      ADMIN_KEY
    );
  }, [isAdmin]);

  /**
   * ==================================================
   * PERSISTÊNCIA DA PARTIDA ADMIN
   * ==================================================
   */

  useEffect(() => {
    if (isAdminGame) {
      sessionStorage.setItem(
        ADMIN_GAME_KEY,
        "true"
      );

      return;
    }

    sessionStorage.removeItem(
      ADMIN_GAME_KEY
    );
  }, [isAdminGame]);

  /**
   * ==================================================
   * PROTEGER TELAS ADMINISTRATIVAS
   * ==================================================
   *
   * Se por algum motivo a sessão administrativa
   * não estiver ativa, não permitimos permanecer
   * nas telas administrativas.
   */
  useEffect(() => {
    if (
      !isAdmin &&
      (
        screen === "admin" ||
        screen === "participants"
      )
    ) {
      setScreen("registration");
    }
  }, [screen, isAdmin]);

  /**
   * ==================================================
   * CORREÇÃO DE ESTADO INVÁLIDO DO JOGO
   * ==================================================
   *
   * Se a tela salva for "game", mas não existir
   * participante/jogador interno, retorna para uma
   * tela válida.
   */
  useEffect(() => {
    if (
      screen === "game" &&
      !participant
    ) {
      setIsAdminGame(false);

      if (isAdmin) {
        setScreen("admin");
      } else {
        setScreen(
          "registration"
        );
      }
    }
  }, [
    screen,
    participant,
    isAdmin,
  ]);

  /**
   * ==================================================
   * PARTICIPANTE NORMAL
   * ==================================================
   */

  function handleRegistrationSuccess(
    participantData: ParticipantData
  ) {
    /**
     * Uma partida iniciada pelo cadastro é sempre
     * uma partida normal.
     *
     * Não encerramos a sessão administrativa aqui.
     * Sessão administrativa e tipo de partida são
     * estados independentes.
     */
    setIsAdminGame(false);

    setParticipant(
      participantData
    );

    setScreen("game");
  }

  /**
   * ==================================================
   * LOGIN ADMINISTRATIVO
   * ==================================================
   */

  function handleAdminSuccess() {
    setIsAdmin(true);

    setIsAdminGame(false);

    setParticipant(null);

    setScreen("admin");
  }

  /**
   * ==================================================
   * JOGAR COMO EQUIPE GF
   * ==================================================
   *
   * Estes dados são apenas internos para permitir
   * que o componente Game continue recebendo um
   * ParticipantData.
   *
   * Eles NÃO são credenciais administrativas
   * e NÃO são gravados no cadastro.
   */
  function handlePlayAsGF() {
    const adminParticipant: ParticipantData = {
      name: "Equipe GF",
      company: "GF Consultores",
      role: "Administrador",
      phone: "ADMIN",
    };

    setIsAdminGame(true);

    setParticipant(
      adminParticipant
    );

    setScreen("game");
  }

  /**
   * ==================================================
   * FINALIZAR JOGO
   * ==================================================
   */

  function handleGameFinish() {
    const finishedAdminGame =
      isAdminGame;

    setParticipant(null);

    setIsAdminGame(false);

    /**
     * Se a partida foi iniciada pela Área
     * Administrativa e a sessão continua ativa,
     * retorna para o painel administrativo.
     */
    if (
      finishedAdminGame &&
      isAdmin
    ) {
      setScreen("admin");

      return;
    }

    /**
     * Participante normal retorna para
     * a tela de cadastro.
     */
    setScreen("registration");
  }

  /**
   * ==================================================
   * PARTICIPANTES
   * ==================================================
   */

  function handleParticipants() {
    if (!isAdmin) {
      setScreen(
        "registration"
      );

      return;
    }

    setScreen(
      "participants"
    );
  }

  /**
   * ==================================================
   * EXPORTAÇÃO PARA EXCEL
   * ==================================================
   */

  function handleExport() {
    if (!isAdmin) {
      return;
    }

    const exported =
      exportParticipantsToExcel();

    /**
     * Caso ainda não exista
     * nenhum participante.
     */
    if (!exported) {
      window.alert(
        "Não existem participantes cadastrados para exportar."
      );
    }
  }

  /**
   * ==================================================
   * SAIR DA ÁREA ADMINISTRATIVA
   * ==================================================
   *
   * Este é o único fluxo que encerra explicitamente
   * a sessão administrativa.
   */
  function handleAdminLogout() {
    setIsAdmin(false);

    setIsAdminGame(false);

    setParticipant(null);

    setScreen(
      "registration"
    );
  }

  /**
   * ==================================================
   * VOLTAR DO JOGO ADMINISTRATIVO
   * ==================================================
   */

  function handleAdminGameBack() {
    setParticipant(null);

    setIsAdminGame(false);

    if (isAdmin) {
      setScreen("admin");

      return;
    }

    setScreen(
      "registration"
    );
  }

  /**
   * ==================================================
   * TELA DE PARTICIPANTES
   * ==================================================
   */

  if (
    screen ===
    "participants" &&
    isAdmin
  ) {
    return (
      <Participants
        onBack={() =>
          setScreen("admin")
        }
      />
    );
  }

  /**
   * ==================================================
   * ÁREA ADMINISTRATIVA
   * ==================================================
   */

  if (
    screen === "admin" &&
    isAdmin
  ) {
    return (
      <Admin
        onParticipants={
          handleParticipants
        }
        onPlayAsGF={
          handlePlayAsGF
        }
        onExport={
          handleExport
        }
        onLogout={
          handleAdminLogout
        }
      />
    );
  }

  /**
   * ==================================================
   * JOGO
   * ==================================================
   */

  if (
    screen === "game" &&
    participant
  ) {
    return (
      <Game
        participant={
          participant
        }
        onFinish={
          handleGameFinish
        }
        isAdmin={
          isAdminGame
        }
        onBack={
          isAdminGame &&
          isAdmin
            ? handleAdminGameBack
            : undefined
        }
      />
    );
  }

  /**
   * ==================================================
   * CADASTRO
   * ==================================================
   */

  return (
    <Registration
      onSuccess={
        handleRegistrationSuccess
      }
      onAdminSuccess={
        handleAdminSuccess
      }
    />
  );
}

export default App;