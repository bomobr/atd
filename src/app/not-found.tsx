import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-tinta px-6 text-white">
      <div className="max-w-md">
        <h1 className="largo text-3xl font-bold">Página não encontrada</h1>
        <p className="mt-3 text-lg text-nevoa">
          Para chamar o garçom, escaneie o QR Code ou aproxime o celular da plaquinha da sua mesa.
        </p>
        <Link href="/" className="mt-6 inline-block font-semibold underline underline-offset-4">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
