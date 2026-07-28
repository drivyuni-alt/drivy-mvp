"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input } from "@/components/ui";
import { useSignIn } from "@/features/auth/hooks";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signIn.mutate(
      { email, password },
      { onSuccess: () => router.push("/") }
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Bienvenido de nuevo</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Inicia sesión para ver tus viajes.
      </p>

      <div className="mt-6">
        <OAuthButtons />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        o con tu email
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {signIn.isError && (
          <p className="text-sm text-danger">
            No hemos podido iniciar sesión. Revisa tus credenciales.
          </p>
        )}

        <Button type="submit" size="lg" isLoading={signIn.isPending}>
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-ink-900 underline dark:text-white">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
