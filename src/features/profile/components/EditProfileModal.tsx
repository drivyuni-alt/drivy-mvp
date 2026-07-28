"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { Button, Input, Modal, Textarea } from "@/components/ui";
import type { Tables } from "@/lib/supabase/types";

import { useUpdateProfile } from "../hooks";

export function EditProfileModal({
  profile,
  open,
  onClose,
}: {
  profile: Tables<"users">;
  open: boolean;
  onClose: () => void;
}) {
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({
    firstName: profile.first_name,
    lastName: profile.last_name,
    degree: profile.degree ?? "",
    phone: profile.phone ?? "",
    bio: profile.bio ?? "",
    emergencyContactName: profile.emergency_contact_name ?? "",
    emergencyContactPhone: profile.emergency_contact_phone ?? "",
    autoAcceptBookings: profile.auto_accept_bookings,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    setAvatarFile(event.target.files?.[0] ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile.mutate(
      { userId: profile.id, ...form, avatarFile },
      { onSuccess: onClose }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="edit-avatar" className="text-sm font-medium text-ink-900 underline dark:text-white">
            {avatarFile ? avatarFile.name : "Cambiar foto de perfil"}
          </label>
          <input id="edit-avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
          />
          <Input
            label="Apellidos"
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
          />
        </div>
        <Input label="Carrera" value={form.degree} onChange={(event) => update("degree", event.target.value)} />
        <Input
          label="Teléfono"
          type="tel"
          value={form.phone}
          onChange={(event) => update("phone", event.target.value)}
        />
        <Textarea
          label="Bio"
          rows={2}
          value={form.bio}
          onChange={(event) => update("bio", event.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Contacto de emergencia"
            value={form.emergencyContactName}
            onChange={(event) => update("emergencyContactName", event.target.value)}
          />
          <Input
            label="Teléfono de emergencia"
            type="tel"
            value={form.emergencyContactPhone}
            onChange={(event) => update("emergencyContactPhone", event.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-900 dark:text-neutral-200">
          <input
            type="checkbox"
            checked={form.autoAcceptBookings}
            onChange={(event) => update("autoAcceptBookings", event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
          />
          Aceptar reservas automáticamente por defecto
        </label>

        {updateProfile.isError && (
          <p className="text-sm text-danger">No se pudo guardar. Inténtalo de nuevo.</p>
        )}

        <Button type="submit" isLoading={updateProfile.isPending}>
          Guardar cambios
        </Button>
      </form>
    </Modal>
  );
}
