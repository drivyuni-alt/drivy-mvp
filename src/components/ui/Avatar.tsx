import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: AvatarSize;
  className?: string;
}

/**
 * Foto de perfil, con recambio para cuando no la hay.
 *
 * La foto es opcional al registrarse ("puedes añadirla después"), así que la mayoría de las
 * cuentas nuevas tienen `users.avatar_url` a null. Hasta ahora cada pantalla pintaba el mismo
 * apaño por su cuenta —un círculo gris con la imagen dentro sólo si existía—, de modo que sin
 * foto quedaba un agujero vacío: en el chat, en la lista de conversaciones, en las
 * solicitudes de reserva, en la tarjeta de viaje, en el perfil y en la barra superior.
 *
 * Con iniciales el hueco pasa a decir algo, y a distinguir a una persona de otra en una lista
 * donde antes eran todas el mismo círculo gris. El verde de marca desaturado se lee como
 * parte del diseño sin competir con los botones, que usan el verde a plena intensidad.
 *
 * Cuando no hay ni nombre —el previo de la foto al registrarse, antes de escribir nada— cae a
 * una silueta genérica.
 *
 * Las medidas son las que ya había en cada sitio, para no mover nada de su posición.
 */
const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-7 w-7 text-[0.625rem]", // tarjeta de viaje
  sm: "h-9 w-9 text-xs", // barra superior, chat, solicitudes
  md: "h-11 w-11 text-sm", // lista de conversaciones
  lg: "h-12 w-12 text-sm", // detalle del viaje
  xl: "h-16 w-16 text-lg", // perfil y registro
};

function initials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function Avatar({ src, firstName, lastName, size = "sm", className }: AvatarProps) {
  const letters = initials(firstName, lastName);

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full",
        !src && "flex items-center justify-center font-semibold",
        !src && "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200",
        src && "bg-neutral-100 dark:bg-neutral-800",
        SIZE_CLASSES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : letters ? (
        // El nombre siempre se escribe al lado, así que para un lector de pantalla esto es
        // decoración: repetirlo sólo añadiría ruido.
        <span aria-hidden>{letters}</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2" aria-hidden>
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5Z" />
        </svg>
      )}
    </div>
  );
}
