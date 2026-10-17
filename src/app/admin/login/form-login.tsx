"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "../acoes";

export function FormLogin() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <form action={acao} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Senha</span>
        <input
          type="password"
          name="senha"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-2 block w-full rounded-xl border-2 border-tinta-3 bg-tinta-2 px-4 py-3 text-lg text-white outline-none focus:border-conta"
        />
      </label>
      {estado.erro && (
        <p role="alert" className="text-sm font-semibold text-[#ff8a78]">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="largo w-full rounded-xl bg-conta px-4 py-3 text-lg font-bold text-tinta disabled:opacity-60"
      >
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
