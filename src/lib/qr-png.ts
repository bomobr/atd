"use client";

import QRCode from "qrcode";
import { LOGO } from "./marca";

export const COR_QR = { dark: "#14232e", light: "#ffffff" };

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function qrDataUrl(url: string, largura = 480): Promise<string> {
  return QRCode.toDataURL(url, { width: largura, margin: 1, errorCorrectionLevel: "M", color: COR_QR });
}

/** Gera e baixa um PNG com "Mesa X", o QR Code e o link por extenso. */
export async function baixarQrPng(numero: number, url: string) {
  const L = 1200;
  const A = 1500;
  const MARGEM = 140; // margem branca em volta do código: ajuda a leitura pela câmera

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, {
    width: L - MARGEM * 2,
    margin: 0,
    errorCorrectionLevel: "M",
    color: COR_QR,
  });

  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, L, A);

  try {
    await document.fonts.load('expanded 800 200px "Archivo Variable"');
  } catch {}
  // Mesmo número largo da plaquinha (font-stretch: expanded)
  const largura = (valor: CanvasFontStretch) => {
    if ("fontStretch" in ctx) ctx.fontStretch = valor;
  };

  // Logo no canto superior direito
  let limiteTexto = L - MARGEM;
  try {
    const logo = await carregarImagem(LOGO.escura);
    const alturaLogo = 190;
    const larguraLogo = (alturaLogo * LOGO.largura) / LOGO.altura;
    const x = L - MARGEM - larguraLogo;
    ctx.drawImage(logo, x, 90, larguraLogo, alturaLogo);
    limiteTexto = x - 40;
  } catch {
    // Sem a logo o PNG continua válido
  }

  ctx.fillStyle = COR_QR.dark;
  ctx.textBaseline = "alphabetic";
  largura("expanded");
  ctx.font = 'expanded 700 64px "Archivo Variable", system-ui, sans-serif';
  ctx.fillText("Mesa", MARGEM, 160);
  // Números longos (ex.: 1024) diminuem para não encostar na logo
  let tamanho = 230;
  do {
    ctx.font = `expanded 800 ${tamanho}px "Archivo Variable", system-ui, sans-serif`;
    tamanho -= 10;
  } while (MARGEM + ctx.measureText(String(numero)).width > limiteTexto && tamanho > 90);
  ctx.fillText(String(numero), MARGEM - 6, 350);

  ctx.drawImage(qr, MARGEM, 420);

  largura("normal");
  ctx.font = '500 32px "Archivo Variable", system-ui, sans-serif';
  ctx.fillStyle = "#566771";
  ctx.fillText(url, MARGEM, 420 + qr.height + 70, L - MARGEM * 2);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Não foi possível gerar a imagem");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `qrcode-mesa-${numero}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Navegadores sem permissão de área de transferência (ex.: http em rede local)
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
