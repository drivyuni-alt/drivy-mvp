import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

/** Las medidas son las que ya tenía cada pantalla, para no mover nada de sitio. */
const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-7 w-7", // tarjeta de viaje
  sm: "h-9 w-9", // barra superior, chat, solicitudes
  md: "h-11 w-11", // lista de conversaciones
  lg: "h-12 w-12", // detalle del viaje
  xl: "h-16 w-16", // perfil y registro
};

/**
 * Cara genérica para cuando no hay foto.
 *
 * Dibujada a mano y no un emoji Unicode (🙂) a propósito. Cada sistema trae su propia
 * tipografía de emoji —Windows, iOS y Android dibujan caras distintas— así que pegar un
 * carácter en el JSX habría dejado el avatar con un aspecto diferente en cada teléfono, que
 * es justo lo que se quería evitar al centralizar esto en un componente. Un SVG propio se ve
 * igual en todas partes y lleva el verde exacto de la marca.
 *
 * La proporción va sobre un lienzo de 40 para que los rasgos escalen solos: la misma cara
 * vale para los 28px de la tarjeta de viaje y para los 64px del perfil.
 */
function GenericFace() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <circle cx="20" cy="20" r="20" className="fill-brand-100 dark:fill-brand-900" />
      <g className="fill-brand-800 dark:fill-brand-200">
        <circle cx="14" cy="16.5" r="2.8" />
        <circle cx="26" cy="16.5" r="2.8" />
      </g>
      <path
        d="M12.2 24.2 Q20 30.4 27.8 24.2"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-brand-800 dark:stroke-brand-200"
      />
    </svg>
  );
}

/**
 * Foto de perfil, con recambio para cuando no la hay.
 *
 * La foto es opcional al registrarse ("puedes añadirla después"), así que la mayoría de las
 * cuentas nuevas tienen `users.avatar_url` a null. Antes cada pantalla pintaba su propio
 * apaño —un círculo gris con la imagen dentro sólo si existía— y sin foto quedaba un agujero
 * vacío en las ocho.
 *
 * La cara cubre los dos casos sin foto, con nombre y sin él: antes había iniciales y, cuando
 * tampoco había nombre —el previo de la foto al registrarse, antes de escribir nada—, una
 * silueta. Dos recambios para el mismo hueco, y el de las iniciales dependía de un dato que
 * no siempre está. Una sola cara es más simple de leer y no depende de nada.
 */
export function Avatar({ src, size = "sm", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden rounded-full",
        src && "bg-neutral-100 dark:bg-neutral-800",
        SIZE_CLASSES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <GenericFace />
      )}
    </div>
  );
}
