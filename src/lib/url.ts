import "server-only";
import { headers } from "next/headers";
import { siteUrlFixa } from "./config";

/**
 * Endereço público do sistema, usado nos QR Codes.
 * Usa SITE_URL se estiver definido; senão, o endereço pelo qual o painel foi aberto.
 */
export async function urlBase(): Promise<string> {
  const fixa = siteUrlFixa();
  if (fixa) return fixa;

  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000").split(",")[0].trim();
  const protocolo =
    (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() ||
    (/^(localhost|127\.|\[::1\])/.test(host) ? "http" : "https");
  return `${protocolo}://${host}`;
}

export function urlMesa(base: string, numero: number): string {
  return `${base}/mesa/${numero}`;
}
