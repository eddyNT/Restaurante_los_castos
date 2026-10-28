"use client";
import { useActionState } from "react";
import { login, register } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useActionState(mode === "login" ? login : register, undefined);
  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "register" && (
        <>
          <div>
            <label className="label" htmlFor="fullName">Nombre completo</label>
            <input className="input" id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Celular</label>
            <input className="input" id="phone" name="phone" required inputMode="tel" autoComplete="tel" />
          </div>
        </>
      )}
      <div>
        <label className="label" htmlFor="email">Correo</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton className="btn-primary w-full" pendingText="Un momento…">
        {mode === "login" ? "Ingresar" : "Crear cuenta"}
      </SubmitButton>
    </form>
  );
}
