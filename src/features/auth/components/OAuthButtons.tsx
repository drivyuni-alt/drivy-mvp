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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.415 2.06-1.246 2.99-.997 1.113-2.209 1.756-3.508 1.653a3.68 3.68 0 01-.043-.545c0-1.096.478-2.267 1.32-3.148C13.31.586 14.61.01 15.679 0c.043.24.686.24.686 1.43zm4.243 15.47c-.24.556-.523 1.088-.85 1.596-.44.686-1.29 1.9-2.242 2.42-.9.49-1.88.8-2.877.44-.85-.31-1.63-.51-2.52-.51-.9 0-1.72.2-2.53.52-.99.36-1.67.14-2.53-.34-.99-.55-1.85-1.71-2.31-2.44-1.44-2.29-2.55-6.49-1.06-9.32.74-1.41 2.07-2.3 3.53-2.33.9-.02 1.75.61 2.32.61.56 0 1.6-.75 2.7-.64.46.02 1.75.19 2.58 1.42-.07.04-1.54.9-1.52 2.68.02 2.13 1.87 2.84 1.89 2.85-.02.06-.3 1.03-.98 2.03z" />
    </svg>
  );
}

export function OAuthButtons() {
  const signInWithOAuth = useSignInWithOAuth();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        leftIcon={<GoogleIcon />}
        isLoading={signInWithOAuth.isPending && signInWithOAuth.variables === "google"}
        onClick={() => signInWithOAuth.mutate("google")}
      >
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        leftIcon={<AppleIcon />}
        isLoading={signInWithOAuth.isPending && signInWithOAuth.variables === "apple"}
        onClick={() => signInWithOAuth.mutate("apple")}
      >
        Apple
      </Button>
    </div>
  );
}
