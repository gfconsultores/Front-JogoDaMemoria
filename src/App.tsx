import { useState } from "react";

import { Game } from "./pages/Game/Game";
import {
  Registration,
  type ParticipantData,
} from "./pages/Registration/Registration";

import "./App.css";

type AppScreen =
  | "registration"
  | "game";

function App() {
  const [screen, setScreen] =
    useState<AppScreen>("registration");

  /**
   * Participante atualmente jogando.
   *
   * Por enquanto os dados ficam na memoria
   * da aplicacao.
   *
   * Futuramente estes dados tambem serao
   * registrados e consultados pelo backend.
   */
  const [participant, setParticipant] =
    useState<ParticipantData | null>(null);

  /**
   * Recebe os dados preenchidos no cadastro
   * e libera o acesso ao jogo.
   */
  function handleRegistrationSuccess(
    participantData: ParticipantData
  ) {
    setParticipant(participantData);
    setScreen("game");
  }

  /**
   * Futuramente sera utilizada quando
   * a participacao terminar.
   *
   * Ao finalizar:
   * - remove o participante atual;
   * - volta para o cadastro;
   * - prepara o sistema para a proxima pessoa.
   */
  function handleGameFinish() {
    setParticipant(null);
    setScreen("registration");
  }

  if (
    screen === "game" &&
    participant
  ) {
    return (
      <Game
        participant={participant}
        onFinish={handleGameFinish}
      />
    );
  }

  return (
    <Registration
      onSuccess={
        handleRegistrationSuccess
      }
    />
  );
}

export default App;