"use client";

export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-tinta px-6 text-white">
      <div className="max-w-md">
        <h1 className="largo text-3xl font-bold">A página não carregou</h1>
        <p className="mt-3 text-lg text-nevoa">
          Pode ser a internet ou o servidor. Tente de novo em alguns segundos. Se continuar, acene para um garçom.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-4 overflow-auto rounded-xl bg-tinta-2 p-3 text-sm whitespace-pre-wrap text-nevoa">
            {error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={reset}
          className="largo mt-6 rounded-xl bg-conta px-6 py-3 text-lg font-bold text-tinta"
        >
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
