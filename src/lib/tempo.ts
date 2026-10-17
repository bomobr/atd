"use client";

import { useEffect, useState } from "react";

/**
 * Relógio que atualiza a cada `intervaloMs`. Começa em `null` para não
 * divergir entre servidor e navegador; só passa a valer depois de montar.
 * `ajusteMs` corrige diferença entre o relógio do computador e o do servidor.
 */
export function useAgora(intervaloMs: number, ajusteMs = 0): number | null {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    const atualizar = () => setAgora(Date.now() + ajusteMs);
    atualizar();
    const timer = setInterval(atualizar, intervaloMs);
    return () => clearInterval(timer);
  }, [intervaloMs, ajusteMs]);
  return agora;
}

export function minutosDesde(iso: string, agora: number): number {
  return Math.max(0, Math.floor((agora - Date.parse(iso)) / 60_000));
}

/** "Agora mesmo", "Há 1 min", "Há 12 min", "Há 1 h 05 min" */
export function tempoDecorrido(iso: string, agora: number | null): string {
  if (agora === null) return "";
  const min = minutosDesde(iso, agora);
  if (min < 1) return "Agora mesmo";
  if (min < 60) return `Há ${min} min`;
  const h = Math.floor(min / 60);
  return `Há ${h} h ${String(min % 60).padStart(2, "0")} min`;
}

export function horaCurta(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** localStorage com proteção: modo anônimo e navegadores restritos podem falhar. */
export function lerLocal<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    return padrao;
  }
}

export function gravarLocal(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {}
}
