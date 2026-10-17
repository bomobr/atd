"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Nfc, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { BarraAdmin } from "@/components/barra-admin";
import { baixarQrPng, copiarTexto, qrDataUrl } from "@/lib/qr-png";
import { porDigitos, type Mesa } from "@/lib/tipos";

interface Props {
  mesasIniciais: Mesa[];
  urlBase: string;
  modoDemo: boolean;
}

type Aviso = { texto: string; erro?: boolean };

const ERROS: Record<string, string> = {
  numero_invalido: "Use um número de mesa entre 1 e 9999.",
  intervalo_invalido: "Confira o intervalo: o número final precisa ser maior ou igual ao inicial.",
  intervalo_grande: "Crie no máximo 200 mesas por vez.",
  numero_em_uso: "Já existe uma mesa com esse número.",
  nao_encontrada: "Essa mesa não existe mais. A lista foi atualizada.",
};

function tipoEndereco(base: string): "local" | "rede" | "publico" {
  let host = "";
  try {
    host = new URL(base).hostname;
  } catch {
    return "publico";
  }
  if (host === "localhost" || host.startsWith("127.") || host === "[::1]" || host.endsWith(".localhost")) {
    return "local";
  }
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith(".local")) return "rede";
  return "publico";
}

export function MesasAdmin({ mesasIniciais, urlBase, modoDemo }: Props) {
  const [mesas, setMesas] = useState<Mesa[]>(mesasIniciais);
  const [de, setDe] = useState("1");
  const [ate, setAte] = useState("10");
  const [nova, setNova] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const endereco = tipoEndereco(urlBase);
  const ativas = mesas.filter((m) => m.ativa).length;

  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(timer);
  }, [aviso]);

  async function api(caminho: string, metodo: string, corpo?: unknown) {
    const resposta = await fetch(caminho, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (resposta.status === 401) {
      window.location.href = "/admin/login";
      throw new Error("nao_autenticado");
    }
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro ?? "erro");
    return dados;
  }

  async function recarregar() {
    const dados = await api("/api/admin/mesas", "GET");
    setMesas(dados.mesas);
  }

  function mostrarErro(erro: unknown) {
    const codigo = erro instanceof Error ? erro.message : "";
    if (codigo === "nao_autenticado") return;
    setAviso({ texto: ERROS[codigo] ?? "Algo deu errado. Confira a conexão e tente de novo.", erro: true });
    if (codigo === "nao_encontrada") recarregar().catch(() => {});
  }

  async function criarIntervalo(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      const dados = await api("/api/admin/mesas", "POST", { de: Number(de), ate: Number(ate) });
      setMesas(dados.mesas);
      setAviso({
        texto:
          dados.criadas === 0
            ? `As mesas de ${de} a ${ate} já existiam.`
            : `${dados.criadas} ${dados.criadas === 1 ? "mesa criada" : "mesas criadas"}.`,
      });
    } catch (erro) {
      mostrarErro(erro);
    } finally {
      setOcupado(false);
    }
  }

  async function criarUma(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    try {
      const dados = await api("/api/admin/mesas", "POST", { numero: Number(nova) });
      setMesas(dados.mesas);
      setAviso({ texto: dados.criadas ? `Mesa ${nova} criada.` : `A mesa ${nova} já existia.` });
      setNova("");
    } catch (erro) {
      mostrarErro(erro);
    } finally {
      setOcupado(false);
    }
  }

  async function atualizar(mesa: Mesa, dados: { numero?: number; ativa?: boolean }): Promise<boolean> {
    try {
      const { mesa: atualizada } = await api(`/api/admin/mesas/${mesa.id}`, "PATCH", dados);
      setMesas((lista) =>
        lista.map((m) => (m.id === mesa.id ? atualizada : m)).sort((a, b) => a.numero - b.numero),
      );
      return true;
    } catch (erro) {
      mostrarErro(erro);
      return false;
    }
  }

  async function remover(mesa: Mesa) {
    const ok = window.confirm(
      `Remover a Mesa ${mesa.numero}?\n\nA plaquinha e a tag NFC dessa mesa vão parar de funcionar.`,
    );
    if (!ok) return;
    try {
      await api(`/api/admin/mesas/${mesa.id}`, "DELETE");
      setMesas((lista) => lista.filter((m) => m.id !== mesa.id));
      setAviso({ texto: `Mesa ${mesa.numero} removida.` });
    } catch (erro) {
      mostrarErro(erro);
    }
  }

  return (
    <div className="min-h-dvh bg-tinta text-white">
      <BarraAdmin modoDemo={modoDemo} />

      <main className="mx-auto max-w-[1600px] px-4 pt-6 pb-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="largo text-3xl font-bold">Mesas e QR Codes</h1>
            <p className="mt-1 text-nevoa">
              {mesas.length === 0
                ? "Nenhuma mesa cadastrada ainda."
                : `${mesas.length} ${mesas.length === 1 ? "mesa cadastrada" : "mesas cadastradas"}, ${ativas} recebendo chamados.`}
            </p>
          </div>
          {ativas > 0 && (
            <a
              href="/admin/mesas/imprimir"
              target="_blank"
              className="largo flex items-center gap-2 rounded-xl bg-conta px-5 py-3 font-bold text-tinta"
            >
              <Printer className="size-5" aria-hidden />
              Imprimir plaquinhas
            </a>
          )}
        </div>

        <EnderecoPublico urlBase={urlBase} tipo={endereco} />

        <section className="mt-6 grid gap-4 lg:grid-cols-2" aria-label="Adicionar mesas">
          <form onSubmit={criarIntervalo} className="rounded-2xl bg-tinta-2 p-5">
            <h2 className="font-bold">Criar várias mesas</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-nevoa">De</span>
              <CampoNumero valor={de} aoMudar={setDe} rotulo="Primeira mesa" />
              <span className="text-nevoa">até</span>
              <CampoNumero valor={ate} aoMudar={setAte} rotulo="Última mesa" />
              <button
                type="submit"
                disabled={ocupado}
                className="rounded-xl bg-white px-4 py-2.5 font-bold text-tinta disabled:opacity-60"
              >
                Criar mesas
              </button>
            </div>
            <p className="mt-2 text-sm text-nevoa">Mesas que já existem são mantidas como estão.</p>
          </form>

          <form onSubmit={criarUma} className="rounded-2xl bg-tinta-2 p-5">
            <h2 className="font-bold">Adicionar uma mesa</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-nevoa">Número</span>
              <CampoNumero valor={nova} aoMudar={setNova} rotulo="Número da nova mesa" obrigatorio />
              <button
                type="submit"
                disabled={ocupado || !nova}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-bold text-tinta disabled:opacity-60"
              >
                <Plus className="size-5" aria-hidden />
                Adicionar
              </button>
            </div>
            <p className="mt-2 text-sm text-nevoa">Use qualquer número de 1 a 9999, como 101 ou 25.</p>
          </form>
        </section>

        {mesas.length > 0 && (
          <ul className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr))]">
            {mesas.map((m) => (
              <CardMesa
                key={m.id}
                mesa={m}
                url={`${urlBase}/mesa/${m.numero}`}
                aoAtualizar={(dados) => atualizar(m, dados)}
                aoRemover={() => remover(m)}
                aoAvisar={setAviso}
              />
            ))}
          </ul>
        )}
      </main>

      {aviso && (
        <div
          role="status"
          className={`fixed inset-x-4 bottom-5 z-30 mx-auto max-w-lg rounded-2xl px-5 py-4 font-semibold shadow-2xl ${
            aviso.erro ? "bg-alerta text-white" : "bg-white text-tinta"
          }`}
        >
          {aviso.texto}
        </div>
      )}
    </div>
  );
}

function CampoNumero(props: { valor: string; aoMudar: (v: string) => void; rotulo: string; obrigatorio?: boolean }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={1}
      max={9999}
      required={props.obrigatorio ?? true}
      value={props.valor}
      onChange={(e) => props.aoMudar(e.target.value)}
      aria-label={props.rotulo}
      className="w-24 rounded-xl border-2 border-tinta-3 bg-tinta px-3 py-2 text-lg font-semibold text-white tabular-nums outline-none focus:border-conta"
    />
  );
}

function EnderecoPublico({ urlBase, tipo }: { urlBase: string; tipo: "local" | "rede" | "publico" }) {
  return (
    <div
      className={`mt-6 rounded-2xl p-5 ${
        tipo === "local" ? "bg-alerta/15 ring-2 ring-alerta" : tipo === "rede" ? "bg-conta/15 ring-2 ring-conta" : "bg-tinta-2"
      }`}
    >
      <p className="text-sm text-nevoa">Os QR Codes e as tags NFC abrem este endereço:</p>
      <p className="mt-1 text-lg font-semibold break-all">{urlBase}/mesa/…</p>
      {tipo === "local" && (
        <p className="mt-3 max-w-3xl">
          <strong>Este endereço só funciona neste computador.</strong> O celular dos clientes não vai conseguir abrir.
          Publique o sistema na internet (o README explica como) ou defina a variável SITE_URL com o endereço público
          antes de imprimir as plaquinhas.
        </p>
      )}
      {tipo === "rede" && (
        <p className="mt-3 max-w-3xl">
          Este é um endereço da rede local: só funciona para celulares conectados no Wi-Fi do restaurante. Para
          funcionar no 4G/5G dos clientes, publique o sistema na internet.
        </p>
      )}
    </div>
  );
}

function CardMesa(props: {
  mesa: Mesa;
  url: string;
  aoAtualizar: (dados: { numero?: number; ativa?: boolean }) => Promise<boolean>;
  aoRemover: () => void;
  aoAvisar: (a: Aviso) => void;
}) {
  const { mesa, url, aoAtualizar, aoRemover, aoAvisar } = props;
  const [qr, setQr] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [numero, setNumero] = useState(String(mesa.numero));
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let ativo = true;
    qrDataUrl(url).then((d) => ativo && setQr(d));
    return () => {
      ativo = false;
    };
  }, [url]);

  async function salvarNumero(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(numero);
    if (n === mesa.numero) return setEditando(false);
    const ok = window.confirm(
      `Trocar a Mesa ${mesa.numero} para Mesa ${n}?\n\nA plaquinha e a tag NFC atuais vão parar de funcionar. Você vai precisar imprimir e gravar de novo.`,
    );
    if (ok && (await aoAtualizar({ numero: n }))) setEditando(false);
  }

  async function copiar() {
    if (await copiarTexto(url)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } else {
      aoAvisar({ texto: "Não foi possível copiar. Selecione o link e copie manualmente.", erro: true });
    }
  }

  async function baixar() {
    try {
      await baixarQrPng(mesa.numero, url);
    } catch {
      aoAvisar({ texto: "Não foi possível gerar a imagem. Tente de novo.", erro: true });
    }
  }

  return (
    <li className={`flex flex-col rounded-3xl bg-white p-5 text-tinta ${mesa.ativa ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        {editando ? (
          <form onSubmit={salvarNumero} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={9999}
              required
              autoFocus
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              aria-label="Novo número da mesa"
              className="w-24 rounded-lg border-2 border-linha px-2 py-1 text-xl font-bold outline-none focus:border-tinta"
            />
            <button type="submit" aria-label="Salvar número" className="rounded-lg bg-tinta p-2 text-white">
              <Check className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Cancelar"
              onClick={() => {
                setNumero(String(mesa.numero));
                setEditando(false);
              }}
              className="rounded-lg p-2 text-cinza hover:bg-linha"
            >
              <X className="size-5" aria-hidden />
            </button>
          </form>
        ) : (
          <h2 className="flex items-end gap-2">
            <span className="largo pb-1 text-lg font-bold">Mesa</span>
            <span className={`numeral ${porDigitos(mesa.numero, ["text-6xl", "text-5xl", "text-4xl"])}`}>
              {mesa.numero}
            </span>
          </h2>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <span className={mesa.ativa ? "text-garcom" : "text-cinza"}>{mesa.ativa ? "Ativa" : "Desativada"}</span>
          <input
            type="checkbox"
            role="switch"
            checked={mesa.ativa}
            onChange={(e) => aoAtualizar({ ativa: e.target.checked })}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-11 rounded-full bg-linha transition-colors peer-checked:bg-garcom peer-focus-visible:outline-3 peer-focus-visible:outline-conta after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
          />
        </label>
      </div>

      <div className="mx-auto my-4 aspect-square w-full max-w-56">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt={`QR Code da Mesa ${mesa.numero}`} className="size-full" />
        ) : (
          <div className="size-full animate-pulse rounded-xl bg-linha" />
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-papel px-3 py-2 ring-1 ring-linha">
        <Nfc className="size-4 shrink-0 text-cinza" aria-hidden />
        <code className="min-w-0 flex-1 truncate text-sm" title={url}>
          {url}
        </code>
        <button
          type="button"
          onClick={copiar}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold hover:bg-linha"
        >
          {copiado ? <Check className="size-4 text-garcom" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={baixar}
          className="flex items-center justify-center gap-2 rounded-xl bg-tinta px-3 py-2.5 text-sm font-bold text-white"
        >
          <Download className="size-4" aria-hidden />
          Baixar PNG
        </button>
        <a
          href={`/admin/mesas/imprimir?mesas=${mesa.numero}`}
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-xl bg-papel px-3 py-2.5 text-sm font-bold ring-1 ring-linha hover:bg-linha"
        >
          <Printer className="size-4" aria-hidden />
          Imprimir
        </a>
      </div>

      <div className="mt-3 flex justify-between border-t border-linha pt-3">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-cinza hover:bg-linha hover:text-tinta"
        >
          <Pencil className="size-4" aria-hidden />
          Trocar número
        </button>
        <button
          type="button"
          onClick={aoRemover}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-alerta hover:bg-alerta/10"
        >
          <Trash2 className="size-4" aria-hidden />
          Remover
        </button>
      </div>
    </li>
  );
}
