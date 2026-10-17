import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { estaLogado } from "@/lib/auth";
import { usandoSenhaDemo } from "@/lib/config";
import { FormLogin } from "./form-login";

export const metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-tinta px-5 text-white">
      <div className="w-full max-w-sm">
        <Logo fundo="escuro" altura={64} className="mb-10" />
        <h1 className="largo text-3xl font-bold">Painel do restaurante</h1>
        <p className="mt-2 text-nevoa">Digite a senha para ver os chamados das mesas.</p>
        <FormLogin />
        <Suspense>
          <Situacao />
        </Suspense>
      </div>
    </main>
  );
}

async function Situacao() {
  await connection();
  if (await estaLogado()) redirect("/admin/painel");
  if (!usandoSenhaDemo()) return null;
  return (
    <p className="mt-6 rounded-xl bg-tinta-2 px-4 py-3 text-sm text-nevoa">
      Modo demonstração: a senha é <strong className="text-white">admin</strong>. Para trocar, defina ADMIN_PASSWORD.
    </p>
  );
}
