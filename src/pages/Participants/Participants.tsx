import { useState } from "react";

import {
  getParticipants,
  type StoredParticipant,
} from "../../storage/participantsStorage";

import "./Participants.css";

interface ParticipantsProps {
  onBack: () => void;
}

export function Participants({
  onBack,
}: ParticipantsProps) {
  const [participants] = useState<StoredParticipant[]>(
    () => getParticipants()
  );

  /**
   * Formata o telefone apenas para exibição.
   */
  function formatPhone(phone: string) {
    const numbers = phone.replace(/\D/g, "");

    if (numbers.length !== 11) {
      return phone;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      7
    )}-${numbers.slice(7)}`;
  }

  return (
    <main className="participants-page">
      {/* VOLTAR PARA A ÁREA ADMINISTRATIVA */}
      <button
        type="button"
        className="participants-back"
        onClick={onBack}
        aria-label="Voltar para a área administrativa"
        title="Voltar"
      >
        <span className="participants-back-icon" />
      </button>

      <section className="participants-container">
        {/* CABEÇALHO */}
        <header className="participants-header">
          <span>Desafio GF</span>

          <h1>
            Participantes cadastrados
          </h1>

          <p>
            Total de participantes:{" "}
            <strong>
              {participants.length}
            </strong>
          </p>
        </header>

        {/* SEM PARTICIPANTES */}
        {participants.length === 0 ? (
          <div className="participants-empty">
            Nenhum participante cadastrado.
          </div>
        ) : (
          /* TABELA */
          <div className="participants-table-wrapper">
            <table className="participants-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Empresa</th>
                  <th>Telefone</th>
                </tr>
              </thead>

              <tbody>
                {participants.map(
                  (participant, index) => (
                    <tr
                      key={`${participant.phone}-${index}`}
                    >
                      <td>
                        {participant.name}
                      </td>

                      <td>
                        {participant.company}
                      </td>

                      <td>
                        {formatPhone(
                          participant.phone
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}