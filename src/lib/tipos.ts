export type TipoChamado = "garcom" | "conta";
export type StatusChamado = "pendente" | "em_atendimento" | "atendido";

export interface Mesa {
  id: string;
  numero: number;
  ativa: boolean;
  created_at: string;
}

export interface Chamado {
  id: string;
  mesa_numero: number;
  tipo: TipoChamado;
  status: StatusChamado;
  created_at: string;
  atendido_em: string | null;
}

/** Como o navegador deve ouvir as mudanças em tempo real. */
export type ConfigTempoReal =
  | { modo: "supabase"; url: string; chavePublica: string }
  | { modo: "demo" };

export const TIPOS: TipoChamado[] = ["garcom", "conta"];
export const STATUS: StatusChamado[] = ["pendente", "em_atendimento", "atendido"];

/** Tempo (em segundos) em que os botões do cliente ficam bloqueados após um chamado. */
export const COOLDOWN_SEGUNDOS = 45;

/** A partir de quantos minutos um chamado pendente ganha destaque de atraso no painel. */
export const ALERTA_MINUTOS = 3;

export const NOME_TIPO: Record<TipoChamado, string> = {
  garcom: "Chamar garçom",
  conta: "Pedir a conta",
};

export const NOME_STATUS: Record<StatusChamado, string> = {
  pendente: "Aguardando atendimento",
  em_atendimento: "Em atendimento",
  atendido: "Atendido",
};

/**
 * Escolhe o tamanho do número da mesa conforme a quantidade de dígitos,
 * para que mesas como 101 ou 1024 caibam no mesmo espaço que a mesa 7.
 */
export function porDigitos<T>(numero: number, [ate2, tres, quatro]: [T, T, T]): T {
  const digitos = String(numero).length;
  return digitos <= 2 ? ate2 : digitos === 3 ? tres : quatro;
}

export function numeroMesaValido(valor: unknown): number | null {
  const n = typeof valor === "number" ? valor : Number(String(valor ?? "").trim());
  return Number.isInteger(n) && n >= 1 && n <= 9999 ? n : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuidValido(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}
