import { useEffect, useState } from "react";

import "./GameCountdown.css";

interface GameCountdownProps {
  onComplete: () => void;
}

export function GameCountdown({
  onComplete,
}: GameCountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    /**
     * Quando chegamos ao zero,
     * exibimos "JÁ!" por alguns instantes
     * antes de liberar a memorização.
     */
    if (count === 0) {
      const timer = window.setTimeout(() => {
        onComplete();
      }, 650);

      return () => {
        window.clearTimeout(timer);
      };
    }

    /**
     * 3 -> 2 -> 1 -> JÁ!
     */
    const timer = window.setTimeout(() => {
      setCount((previous) =>
        Math.max(previous - 1, 0)
      );
    }, 850);

    return () => {
      window.clearTimeout(timer);
    };
  }, [count, onComplete]);

  return (
    <div className="game-countdown-overlay">
      <div
        key={count}
        className="game-countdown-number"
      >
        {count === 0 ? "JÁ!" : count}
      </div>
    </div>
  );
}