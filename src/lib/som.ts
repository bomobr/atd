"use client";

import type { TipoChamado } from "./tipos";

/**
 * Campainha suave sintetizada com a Web Audio API (não precisa de arquivo de áudio).
 * O navegador só permite tocar som depois de um clique do usuário — por isso o
 * painel tem o botão "Iniciar turno", que chama `liberarAudio()`.
 */
let contexto: AudioContext | null = null;

export async function liberarAudio(): Promise<boolean> {
  try {
    contexto ??= new AudioContext();
    if (contexto.state !== "running") await contexto.resume();
    return contexto.state === "running";
  } catch {
    return false;
  }
}

export function audioLiberado(): boolean {
  return contexto?.state === "running";
}

/** Uma nota de sino: fundamental + parcial "metálico" com decaimento exponencial. */
function nota(ctx: AudioContext, destino: AudioNode, freq: number, inicio: number, duracao: number) {
  const parciais: [number, number][] = [
    [1, 1],
    [2.76, 0.22],
    [5.4, 0.06],
  ];
  for (const [multiplo, ganhoRelativo] of parciais) {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * multiplo;
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(ganhoRelativo, inicio + 0.012);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao / multiplo ** 0.3);
    osc.connect(ganho).connect(destino);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.05);
  }
}

/**
 * Toca a campainha. `volume` de 0 a 100.
 * Garçom: duas notas descendo (ding-dong). Conta: duas notas subindo.
 */
export function tocarCampainha(tipo: TipoChamado, volume: number) {
  const ctx = contexto;
  if (!ctx || ctx.state !== "running" || volume <= 0) return;

  const mestre = ctx.createGain();
  // Curva perceptiva: o controle fica mais natural do que linear
  mestre.gain.value = Math.pow(Math.min(volume, 100) / 100, 1.6) * 0.5;
  mestre.connect(ctx.destination);

  const t = ctx.currentTime + 0.02;
  const [primeira, segunda] = tipo === "garcom" ? [987.77, 783.99] : [783.99, 1046.5];
  nota(ctx, mestre, primeira, t, 1.3);
  nota(ctx, mestre, segunda, t + 0.28, 1.6);

  setTimeout(() => mestre.disconnect(), 2500);
}
