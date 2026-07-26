"use client";

import { useEffect } from "react";

export function useKonami(onUnlock: () => void) {
  useEffect(() => {
    const sequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let index = 0;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === sequence[index]) {
        index += 1;
        if (index === sequence.length) {
          index = 0;
          onUnlock();
        }
      } else {
        index = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUnlock]);
}
