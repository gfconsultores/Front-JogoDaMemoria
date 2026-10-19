
import { useEffect, useState } from "react";

import { Game } from "./pages/Game/Game";

import {
  Registration,
  type ParticipantData,
} from "./pages/Registration/Registration";

import { Participants } from "./pages/Participants/Participants";
import { Admin } from "./pages/Admin/Admin";

import {
  downloadParticipantsExcel,
  shareParticipantsExcel,
} from "./export/participantsExport";

import { syncPendingParticipants } from "./sync/participantSync";

import { DeviceActivation } from "./components/DeviceActivation/DeviceActivation";
import { isDeviceAuthenticated } from "./lib/deviceAuth";

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
 * CHAVES DA SESSÃO
 */
const SCREEN_KEY = "gf-memory-current-screen";
const PARTICIPANT_KEY = "gf-memory-current-participant";
const ADMIN_KEY = "gf-memory-admin-session";
const ADMIN_GAME_KEY = "gf-memory-admin-game";

/**
 * RECUPERAR TELA ATUAL
 */
function getInitialScreen(): AppScreen {
  const savedScreen = sessionStorage.getItem(SCREEN_KEY);

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
 * RECUPERAR PARTICIPANTE ATUAL
 */
function getInitialParticipant(): ParticipantData | null {
  const savedParticipant =
    sessionStorage.getItem(PARTICIPANT_KEY);

  if (!savedParticipant) {
    return null;
  }

  try {
    return JSON.parse(savedParticipant) as ParticipantData;
  } catch {
    return null;
  }
}

/**
 * RECUPERAR SESSÃO ADMINISTRATIVA
 */
function getInitialAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === "true";
}

/**
 * RECUPERAR TIPO DA PARTIDA
 */
function getInitialAdminGame(): boolean {
  return sessionStorage.getItem(ADMIN_GAME_KEY) === "true";
}

function App() {
  /**
   * ATIVAÇÃO DO QUIOSQUE GF
   *
   * Verifica a autenticação técnica do Supabase.
   *
   * - Sem internet: permite utilizar o jogo.
   * - Com sessão salva: abre normalmente.
   * - Com internet e sem sessão: solicita ativação.
   */
  const [activationStatus, setActivationStatus] =
    useState<"checking" | "required" | "ready">(
      "checking"
    );

  useEffect(() => {
    let active = true;

    async function checkActivation() {
      if (!navigator.onLine) {
        if (active) {
          setActivationStatus("ready");
        }
        return;
      }

      try {
        const authenticated =
          await isDeviceAuthenticated();

        if (active) {
          setActivationStatus(
            authenticated ? "ready" : "required"
          );
        }
      } catch (error) {
        console.warn(
          "[GF] Não foi possível verificar a ativação:",
          error
        );

        if (active) {
          setActivationStatus("ready");
        }
      }
    }

    void checkActivation();

    return () => {
      active = false;
    };
  }, []);

  /**
   * SINCRONIZAÇÃO AUTOMÁTICA COM SUPABASE
   *
   * Tenta sincronizar:
   * 1. Ao abrir o aplicativo.
   * 2. Quando a conexão retorna.
   *
   * Não bloqueia o funcionamento do jogo.
   */
  useEffect(() => {
    function attemptSync() {
      void syncPendingParticipants().catch((error) => {
        console.warn(
          "[GF Sync] Sincronização automática adiada:",
          error
        );
      });
    }

    attemptSync();

    window.addEventListener("online", attemptSync);

    return () => {
      window.removeEventListener("online", attemptSync);
    };
  }, []);

  /**
   * ESTADO PRINCIPAL
   */
  const [screen, setScreen] =
    useState<AppScreen>(getInitialScreen);

  /**
   * PARTICIPANTE ATUAL
   *
   * Nas partidas administrativas, o participante
   * interno não é salvo no cadastro.
   */
  const [participant, setParticipant] =
    useState<ParticipantData | null>(
      getInitialParticipant
    );

  /**
   * SESSÃO ADMINISTRATIVA
   */
  const [isAdmin, setIsAdmin] =
    useState<boolean>(getInitialAdminSession);

  /**
   * PARTIDA ADMINISTRATIVA
   */
  const [isAdminGame, setIsAdminGame] =
    useState<boolean>(getInitialAdminGame);

  /**
   * CONTROLE DA EXPORTAÇÃO
   */
  const [isExporting, setIsExporting] =
    useState<boolean>(false);

  /**
   * PERSISTÊNCIA DA TELA
   */
  useEffect(() => {
    sessionStorage.setItem(SCREEN_KEY, screen);
  }, [screen]);

  /**
   * PERSISTÊNCIA DO PARTICIPANTE
   */
  useEffect(() => {
    if (participant) {
      sessionStorage.setItem(
        PARTICIPANT_KEY,
        JSON.stringify(participant)
      );
      return;
    }

    sessionStorage.removeItem(PARTICIPANT_KEY);
  }, [participant]);

  /**
   * PERSISTÊNCIA DA SESSÃO ADMIN
   */
  useEffect(() => {
    if (isAdmin) {
      sessionStorage.setItem(ADMIN_KEY, "true");
      return;
    }

    sessionStorage.removeItem(ADMIN_KEY);
  }, [isAdmin]);

  /**
   * PERSISTÊNCIA DA PARTIDA ADMIN
   */
  useEffect(() => {
    if (isAdminGame) {
      sessionStorage.setItem(ADMIN_GAME_KEY, "true");
      return;
    }

    sessionStorage.removeItem(ADMIN_GAME_KEY);
  }, [isAdminGame]);

  /**
   * PROTEGER TELAS ADMINISTRATIVAS
   */
  useEffect(() => {
    if (
      !isAdmin &&
      (screen === "admin" || screen === "participants")
    ) {
      setScreen("registration");
    }
  }, [screen, isAdmin]);

  /**
   * CORREÇÃO DE ESTADO INVÁLIDO DO JOGO
   */
  useEffect(() => {
    if (screen === "game" && !participant) {
      setIsAdminGame(false);

      if (isAdmin) {
        setScreen("admin");
      } else {
        setScreen("registration");
      }
    }
  }, [screen, participant, isAdmin]);

  /**
   * CADASTRO DE PARTICIPANTE
   */
  function handleRegistrationSuccess(
    participantData: ParticipantData
  ) {
    setIsAdminGame(false);
    setParticipant(participantData);
    setScreen("game");
  }

  /**
   * LOGIN ADMINISTRATIVO
   */
  function handleAdminSuccess() {
    setIsAdmin(true);
    setIsAdminGame(false);
    setParticipant(null);
    setScreen("admin");
  }

  /**
   * JOGAR COMO EQUIPE GF
   *
   * Não grava participante no banco.
   */
  function handlePlayAsGF() {
    const adminParticipant: ParticipantData = {
      name: "Equipe GF",
      company: "GF Consultores",
      role: "Administrador",
      phone: "ADMIN",
    };

    setIsAdminGame(true);
    setParticipant(adminParticipant);
    setScreen("game");
  }

  /**
   * FINALIZAR JOGO
   */
  function handleGameFinish() {
    const finishedAdminGame = isAdminGame;

    setParticipant(null);
    setIsAdminGame(false);

    if (finishedAdminGame && isAdmin) {
      setScreen("admin");
      return;
    }

    setScreen("registration");
  }

  /**
   * ABRIR PARTICIPANTES
   */
  function handleParticipants() {
    if (!isAdmin) {
      setScreen("registration");
      return;
    }

    setScreen("participants");
  }

  /**
   * BAIXAR PLANILHA EXCEL
   */
  async function handleDownloadExcel() {
    if (!isAdmin || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const result = await downloadParticipantsExcel();

      if (!result.success) {
        if (result.status === "NO_DATA") {
          window.alert(
            "Não existem participantes cadastrados para exportar."
          );
        } else if (result.status === "ERROR") {
          window.alert(
            `Não foi possível salvar a planilha: ${
              result.error || "Tente novamente."
            }`
          );
        }

        return;
      }

      window.alert("Planilha salva com sucesso!");
    } catch {
      window.alert(
        "Ocorreu um erro ao salvar a planilha."
      );
    } finally {
      setIsExporting(false);
    }
  }

  /**
   * COMPARTILHAR PLANILHA EXCEL
   */
  async function handleShareExcel() {
    if (!isAdmin || isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const result = await shareParticipantsExcel();

      if (!result.success) {
        if (result.status === "NO_DATA") {
          window.alert(
            "Não existem participantes cadastrados para exportar."
          );
        } else if (result.status === "ERROR") {
          window.alert(
            `Não foi possível compartilhar a planilha: ${
              result.error || "Tente novamente."
            }`
          );
        }

        return;
      }

      // O menu nativo de compartilhamento foi aberto.
      // O usuário selecionará o aplicativo de destino.
    } catch {
      window.alert(
        "Ocorreu um erro ao acionar o compartilhamento."
      );
    } finally {
      setIsExporting(false);
    }
  }

  /**
   * SAIR DA ÁREA ADMINISTRATIVA
   */
  function handleAdminLogout() {
    setIsAdmin(false);
    setIsAdminGame(false);
    setParticipant(null);
    setScreen("registration");
  }

  /**
   * VOLTAR DO JOGO ADMINISTRATIVO
   */
  function handleAdminGameBack() {
    setParticipant(null);
    setIsAdminGame(false);

    if (isAdmin) {
      setScreen("admin");
      return;
    }

    setScreen("registration");
  }

  /**
   * TELA DE PREPARAÇÃO DO QUIOSQUE
   */
  if (activationStatus === "checking") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p>Preparando o quiosque GF...</p>
      </main>
    );
  }

  /**
   * TELA DE ATIVAÇÃO TÉCNICA
   */
  if (activationStatus === "required") {
    return (
      <DeviceActivation
        onContinueOffline={() => {
          setActivationStatus("ready");
        }}
        onSuccess={() => {
          setActivationStatus("ready");

          void syncPendingParticipants().catch(
            (error) => {
              console.warn(
                "[GF Sync] Sincronização após ativação adiada:",
                error
              );
            }
          );
        }}
      />
    );
  }

  /**
   * TELA DE PARTICIPANTES
   */
  if (screen === "participants" && isAdmin) {
    return (
      <Participants
        onBack={() => setScreen("admin")}
      />
    );
  }

  /**
   * ÁREA ADMINISTRATIVA
   */
  if (screen === "admin" && isAdmin) {
    return (
      <Admin
        onParticipants={handleParticipants}
        onPlayAsGF={handlePlayAsGF}
        onDownloadExcel={handleDownloadExcel}
        onShareExcel={handleShareExcel}
        isExporting={isExporting}
        onLogout={handleAdminLogout}
      />
    );
  }

  /**
   * TELA DO JOGO
   */
  if (screen === "game" && participant) {
    return (
      <Game
        participant={participant}
        onFinish={handleGameFinish}
        isAdmin={isAdminGame}
        onBack={
          isAdminGame && isAdmin
            ? handleAdminGameBack
            : undefined
        }
      />
    );
  }

  /**
   * TELA DE CADASTRO
   */
  return (
    <Registration
      onSuccess={handleRegistrationSuccess}
      onAdminSuccess={handleAdminSuccess}
    />
  );
}

export default App;
