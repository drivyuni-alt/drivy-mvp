"use client";

import { Button } from "@/components/ui";

import { useSignInWithOAuth } from "../hooks";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.42-.22-2.05H12v3.72h6.5c-.13 1.05-.84 2.63-2.42 3.7l-.02.15 3.52 2.72.24.02c2.24-2.06 3.53-5.1 3.53-8.26"
      />
      <path
        fill="#34A853"
        d="M12 24c3.19 0 5.87-1.06 7.83-2.87l-3.73-2.9c-1 .7-2.35 1.19-4.1 1.19-3.13 0-5.78-2.06-6.73-4.9l-.14.01-3.66 2.83-.05.14C3.34 21.3 7.35 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.52a7.4 7.4 0 010-4.72l-.01-.16-3.7-2.87-.12.06a11.94 11.94 0 000 10.66z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.22 0 3.72.95 4.58 1.75l3.34-3.26C17.86 1.24 15.19 0 12 0 7.35 0 3.34 2.7 1.44 6.62l3.82 2.96C6.22 6.8 8.87 4.75 12 4.75"
      />
    </svg>
  );
}

/**
 * Sólo Google de momento. "Sign in with Apple" exige estar dado de alta en el Apple
 * Developer Program (~99 €/año), un coste que no tiene sentido asumir para validar el MVP.
 * El proveedor `"apple"` sigue existiendo en `OAuthProvider` y el callback de OAuth ya lo
 * soporta, así que reactivarlo el día que se pague la cuenta es volver a añadir un botón
 * aquí — no hay que tocar nada más.
 */
export function OAuthButtons() {
  const signInWithOAuth = useSignInWithOAuth();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      leftIcon={<GoogleIcon />}
      isLoading={signInWithOAuth.isPending && signInWithOAuth.variables === "google"}
      onClick={() => signInWithOAuth.mutate("google")}
    >
      Continuar con Google
    </Button>
  );
}
