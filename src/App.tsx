import { useEffect, useState } from "react";

import { Game } from "./pages/Game/Game";

import {
  Registration,
  type ParticipantData,
} from "./pages/Registration/Registration";

import { Participants } from "./pages/Participants/Participants";
import { Admin } from "./pages/Admin/Admin";

import { GF_ADMIN } from "./config/adminConfig";

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
   */
  const [
    participant,
    setParticipant,
  ] =
    useState<ParticipantData | null>(
      getInitialParticipant
    );

  /**
   * Indica se existe uma sessão
   * administrativa ativa.
   */
  const [isAdmin, setIsAdmin] =
    useState<boolean>(
      getInitialAdminSession
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
   * CORREÇÃO DE ESTADO INVÁLIDO
   * ==================================================
   *
   * Se a tela salva for "game",
   * mas não existir participante,
   * retorna para uma tela válida.
   */

  useEffect(() => {
    if (
      screen === "game" &&
      !participant
    ) {
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
    setIsAdmin(false);

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

    setParticipant(null);

    setScreen("admin");
  }

  /**
   * ==================================================
   * JOGAR COMO ADMINISTRADOR
   * ==================================================
   */

  function handlePlayAsGF() {
    const adminParticipant: ParticipantData =
      {
        name: "Equipe GF",
        company:
          GF_ADMIN.company,
        phone:
          GF_ADMIN.phone,
      };

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
    setParticipant(null);

    /**
     * Se a sessão administrativa
     * continua ativa, volta para
     * a Área Administrativa.
     */
    if (isAdmin) {
      setScreen("admin");

      return;
    }

    /**
     * Participante normal retorna
     * para o cadastro.
     */
    setScreen("registration");
  }

  /**
   * ==================================================
   * PARTICIPANTES
   * ==================================================
   */

  function handleParticipants() {
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
   */

  function handleAdminLogout() {
    setIsAdmin(false);

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

    setScreen("admin");
  }

  /**
   * ==================================================
   * TELA DE PARTICIPANTES
   * ==================================================
   */

  if (
    screen ===
    "participants"
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
    screen === "admin"
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
          isAdmin
        }
        onBack={
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