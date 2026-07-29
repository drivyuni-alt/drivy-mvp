"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Select } from "@/components/ui";
import { useSignUp, useUniversities } from "@/features/auth/hooks";
import { OAuthButtons } from "@/features/auth/components/OAuthButtons";
import type { SignUpInput } from "@/features/auth/types";

const emptyForm: Omit<SignUpInput, "avatarFile"> = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  universityId: "",
  universityEmail: "",
  degree: "",
  phone: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const signUp = useSignUp();
  const universities = useUniversities();

  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signUp.mutate({ ...form, avatarFile });
  }

  const universityOptions =
    universities.data?.map((university) => ({
      value: university.id,
      label: university.name,
    })) ?? [];

  if (signUp.isSuccess) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Revisa tu correo</h1>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Te hemos enviado un email a <strong>{form.email}</strong> para confirmar tu cuenta.
          Ábrelo y pulsa el enlace de confirmación antes de iniciar sesión — si no lo ves,
          revisa también la carpeta de spam.
        </p>
        <Button type="button" className="mt-6" size="lg" onClick={() => router.push("/login")}>
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Verifica tu correo universitario para empezar a compartir viajes.
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
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            {avatarPreview && (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="avatar"
              className="cursor-pointer text-sm font-medium text-ink-900 underline dark:text-white"
            >
              Subir foto de perfil
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-neutral-400">Opcional, puedes añadirla después.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            required
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
          />
          <Input
            label="Apellidos"
            required
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
          />
        </div>

        <Select
          label="Universidad"
          required
          placeholder={universities.isLoading ? "Cargando universidades…" : "Selecciona tu universidad"}
          options={universityOptions}
          value={form.universityId}
          onChange={(event) => updateField("universityId", event.target.value)}
        />

        <Input
          label="Carrera"
          required
          value={form.degree}
          onChange={(event) => updateField("degree", event.target.value)}
        />

        <Input
          label="Correo universitario"
          type="email"
          hint="Lo usamos para verificar que perteneces a tu universidad."
          required
          value={form.universityEmail}
          onChange={(event) => updateField("universityEmail", event.target.value)}
        />

        <Input
          label="Teléfono"
          type="tel"
          required
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
        />

        {signUp.isError && (
          <p className="text-sm text-danger">
            {signUp.error.message.toLowerCase().includes("rate limit")
              ? "Se han enviado demasiados correos de confirmación en poco tiempo. Espera unos minutos y vuelve a intentarlo."
              : "No hemos podido crear tu cuenta. Inténtalo de nuevo."}
          </p>
        )}

        <Button type="submit" size="lg" isLoading={signUp.isPending}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-ink-900 underline dark:text-white">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
