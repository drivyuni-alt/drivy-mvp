"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { Button, Input } from "@/components/ui";

import {
  useSendImageMessage,
  useSendLocationMessage,
  useSendQuickDelayMessage,
  useSendTextMessage,
} from "../hooks";
import { QUICK_DELAY_TEMPLATES } from "../types";

export function MessageComposer({
  chatId,
  senderId,
  onTyping,
}: {
  chatId: string;
  senderId: string;
  onTyping: () => void;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendText = useSendTextMessage();
  const sendQuickDelay = useSendQuickDelayMessage();
  const sendImage = useSendImageMessage();
  const sendLocation = useSendLocationMessage();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    sendText.mutate(
      { chatId, senderId, content: text.trim() },
      { onSuccess: () => setText("") }
    );
  }

  function handleQuickDelay(templateKey: string) {
    sendQuickDelay.mutate({ chatId, senderId, templateKey });
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) sendImage.mutate({ chatId, senderId, file });
    event.target.value = "";
  }

  function handleShareLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      sendLocation.mutate({
        chatId,
        senderId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }

  const isSending = sendText.isPending || sendImage.isPending || sendLocation.isPending;

  return (
    <div className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-surface-dark sm:p-4">
      <div className="mb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {QUICK_DELAY_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => handleQuickDelay(template.key)}
            disabled={sendQuickDelay.isPending}
            className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800"
          >
            {template.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendImage.isPending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          aria-label="Adjuntar imagen"
        >
          <span aria-hidden>📷</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={handleShareLocation}
          disabled={sendLocation.isPending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          aria-label="Compartir ubicación"
        >
          <span aria-hidden>📍</span>
        </button>

        <Input
          className="flex-1"
          placeholder="Escribe un mensaje…"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onTyping();
          }}
        />

        <Button type="submit" size="md" isLoading={isSending} disabled={!text.trim()}>
          Enviar
        </Button>
      </form>

      {sendText.isError && (
        <p className="mt-2 text-xs text-danger">{sendText.error.message}</p>
      )}
    </div>
  );
}
