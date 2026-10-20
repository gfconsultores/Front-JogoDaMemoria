
import { useState } from "react";
import { signInDevice } from "../../lib/deviceAuth";
import "./DeviceActivation.css";

interface DeviceActivationProps {
  onSuccess: () => void;
  onContinueOffline: () => void;
}

export function DeviceActivation({
  onSuccess,
  onContinueOffline,
}: DeviceActivationProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleActivate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      await signInDevice(email, password);

      setPassword("");
      setError("");

      onSuccess();
    } catch {
      setError(
        "Não foi possível ativar o dispositivo. Verifique a conexão com a internet e as credenciais informadas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleContinueOffline() {
    if (isLoading) return;

    setPassword("");
    setError("");

    onContinueOffline();
  }

  return (
    <main className="device-activation">
      <section className="device-activation-panel">
        <h1>Ativação do Dispositivo</h1>

        <p>
          Configure a sincronização automática
          dos participantes com o Supabase.
        </p>

        <form onSubmit={handleActivate}>
          <label htmlFor="device-email">
            E-mail técnico
          </label>

          <input
            id="device-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="username"
            required
            disabled={isLoading}
          />

          <label htmlFor="device-password">
            Senha
          </label>

          <input
            id="device-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            autoComplete="current-password"
            required
            disabled={isLoading}
          />

          {error && (
            <p role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Ativando..."
              : "Ativar dispositivo"}
          </button>
        </form>

        <div className="device-activation-offline">
          <p>
            Está sem internet? Você pode continuar
            utilizando o jogo normalmente.
            Os participantes serão armazenados
            no dispositivo até a sincronização.
          </p>

          <button
            type="button"
            onClick={handleContinueOffline}
            disabled={isLoading}
          >
            Continuar offline
          </button>
        </div>
      </section>
    </main>
  );
}


// const { createClient } = await import("/node_modules/.vite/deps/@supabase_supabase-js.js");
