
import { useEffect, useState } from "react";

import {
  getParticipants,
  type StoredParticipant,
} from "../../storage/participantsStorage";

import { supabase } from "../../lib/supabase";
import { deleteParticipantEverywhere } from "../../services/participantDeletion";

import "./Participants.css";

interface ParticipantsProps {
  onBack: () => void;
}

type OnlineParticipant = {
  id: string;
  name: string;
  company: string;
  role: string | null;
  phone: string;
  created_at: string;
};

export function Participants({ onBack }: ParticipantsProps) {
  const [participants, setParticipants] = useState<StoredParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedParticipant, setSelectedParticipant] =
    useState<StoredParticipant | null>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadParticipants() {
      try {
        // Primeiro consulta os participantes locais.
        const localParticipants = await getParticipants();

        const merged = new Map<string, StoredParticipant>();

        for (const participant of localParticipants) {
          merged.set(participant.id, participant);
        }

        // Consulta o Supabase somente quando houver internet.
        if (navigator.onLine) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

          if (!sessionError && sessionData.session) {
            const { data, error } = await supabase
              .from("participants")
              .select("id, name, company, role, phone, created_at")
              .order("created_at", { ascending: true });

            if (error) {
              console.warn(
                "[GF Link] Não foi possível consultar o Supabase:",
                error.message
              );
            } else {
              const onlineParticipants =
                (data ?? []) as OnlineParticipant[];

              for (const participant of onlineParticipants) {
                if (!merged.has(participant.id)) {
                  merged.set(participant.id, {
                    id: participant.id,
                    name: participant.name,
                    company: participant.company,
                    role: participant.role ?? "",
                    phone: participant.phone,
                    createdAt: participant.created_at,
                    syncStatus: "synced",
                  });
                }
              }
            }
          }
        }

        const result = Array.from(merged.values()).sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );

        if (isMounted) {
          setParticipants(result);
        }
      } catch (error) {
        console.error("Erro ao carregar participantes:", error);

        if (isMounted) {
          setErrorMessage(
            "Não foi possível carregar os participantes."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadParticipants();

    return () => {
      isMounted = false;
    };
  }, []);

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

  function openDeleteConfirmation(participant: StoredParticipant) {
    setSelectedParticipant(participant);
    setConfirmed(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeDeleteConfirmation() {
    if (isDeleting) return;

    setSelectedParticipant(null);
    setConfirmed(false);
    setErrorMessage("");
  }

  async function handleDelete() {
    if (!selectedParticipant || !confirmed || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteParticipantEverywhere(selectedParticipant.id);

      setParticipants((current) =>
        current.filter(
          (participant) => participant.id !== selectedParticipant.id
        )
      );

      setSelectedParticipant(null);
      setConfirmed(false);

      setSuccessMessage(
        "Participante excluído com sucesso."
      );
    } catch (error) {
      console.error("Erro ao excluir participante:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o participante."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="participants-page">
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
        <header className="participants-header">
          <span>JOGO DA MEMÓRIA</span>

          <h1>Participantes cadastrados</h1>

          <p>
            Total de participantes:{" "}
            <strong>{participants.length}</strong>
          </p>
        </header>

        {successMessage && (
          <p role="status" className="participants-delete-success">
            {successMessage}
          </p>
        )}

        {errorMessage && !selectedParticipant && (
          <p role="alert" className="participants-delete-error">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="participants-empty">
            Carregando participantes...
          </div>
        ) : participants.length === 0 ? (
          <div className="participants-empty">
            Nenhum participante cadastrado.
          </div>
        ) : (
          <div className="participants-table-wrapper">
            <table className="participants-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Empresa</th>
                  <th>Cargo</th>
                  <th>Telefone</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td>{participant.name}</td>
                    <td>{participant.company}</td>
                    <td>{participant.role || "—"}</td>
                    <td>{formatPhone(participant.phone)}</td>
                    <td>
                      <button
                        type="button"
                        className="participants-delete-button"
                        title={`Excluir ${participant.name}`}
                        aria-label={`Excluir participante ${participant.name}`}
                        onClick={() =>
                          openDeleteConfirmation(participant)
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="19"
                          height="19"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedParticipant && (
        <div
          className="participants-modal-overlay"
          role="presentation"
        >
          <div
            className="participants-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="participants-delete-title"
          >
            <h2 id="participants-delete-title">
              Confirmar exclusão
            </h2>

            <p>
              Deseja excluir permanentemente este participante
              do banco local e do Supabase?
            </p>

            <div className="participants-modal-details">
              <p>
                <strong>Nome:</strong>{" "}
                {selectedParticipant.name}
              </p>

              <p>
                <strong>Empresa:</strong>{" "}
                {selectedParticipant.company}
              </p>

              <p>
                <strong>Telefone:</strong>{" "}
                {formatPhone(selectedParticipant.phone)}
              </p>
            </div>

            <label className="participants-modal-checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={isDeleting}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
              />

              <span>
                Confirmo que desejo excluir permanentemente
                este participante.
              </span>
            </label>

            {errorMessage && (
              <p
                role="alert"
                className="participants-delete-error"
              >
                {errorMessage}
              </p>
            )}

            <div className="participants-modal-actions">
              <button
                type="button"
                className="participants-modal-cancel"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="participants-modal-confirm"
                onClick={handleDelete}
                disabled={!confirmed || isDeleting}
              >
                {isDeleting
                  ? "Excluindo..."
                  : "Excluir participante"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
