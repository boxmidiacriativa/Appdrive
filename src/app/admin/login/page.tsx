"use client";

import { useActionState } from "react";
import { Logo } from "@/components/brand";
import { signIn } from "../actions";
import { Button, Card, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Logo tagline="Painel do motorista" />
      <h1 className="mt-8 text-2xl font-bold">Entrar</h1>
      <Card className="mt-6 p-5">
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="username" defaultValue={state?.email} key={state?.email} required />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state?.error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>}
          <Button type="submit" full disabled={pending}>
            {pending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
