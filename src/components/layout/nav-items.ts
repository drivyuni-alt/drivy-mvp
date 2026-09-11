export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "search" | "plus" | "chat" | "profile";
}

/**
 * "Buscar" ya no está en la navegación: el buscador vive en la pantalla de Inicio y tener
 * las dos cosas era redundante.
 *
 * La ruta `/trips/search` SIGUE existiendo y no debe borrarse — es la pantalla de
 * resultados a la que lleva el formulario de Inicio, además del enlace "Ver todos los
 * viajes". Simplemente ya no se llega a ella desde la barra de navegación.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/trips/new", label: "Publicar", icon: "plus" },
  { href: "/chats", label: "Mensajes", icon: "chat" },
  { href: "/profile", label: "Perfil", icon: "profile" },
];
