export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "search" | "plus" | "chat" | "profile";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/trips/search", label: "Buscar", icon: "search" },
  { href: "/trips/new", label: "Publicar", icon: "plus" },
  { href: "/chats", label: "Mensajes", icon: "chat" },
  { href: "/profile", label: "Perfil", icon: "profile" },
];
