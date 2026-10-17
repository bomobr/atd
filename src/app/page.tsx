import Link from "next/link";
import { BookOpen, Nfc, QrCode } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Inicio() {
  return (
    <main className="flex min-h-dvh flex-col justify-between bg-tinta px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <Logo fundo="escuro" altura={60} />
      </div>
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex gap-3 text-conta">
          <QrCode className="size-10" aria-hidden />
          <Nfc className="size-10" aria-hidden />
        </div>
        <h1 className="largo text-4xl leading-tight font-bold">Escaneie o código da sua mesa</h1>
        <p className="mt-4 text-lg text-nevoa">
          Aponte a câmera do celular para o QR Code da plaquinha, ou aproxime o celular dela. Pela página que
          abrir você vê o cardápio, chama o garçom ou pede a conta.
        </p>
        <Link
          href="/cardapio"
          className="largo mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-lg font-bold text-tinta"
        >
          <BookOpen className="size-6" strokeWidth={2.2} aria-hidden />
          Ver cardápio
        </Link>
      </div>
      <p className="mx-auto w-full max-w-md text-sm text-nevoa">
        Trabalha aqui?{" "}
        <Link href="/admin/painel" className="font-semibold text-white underline underline-offset-4">
          Abrir o painel
        </Link>
      </p>
    </main>
  );
}
