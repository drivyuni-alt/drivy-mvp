import { redirect } from "next/navigation";

import { ChatListScreen } from "@/features/chat/components/ChatListScreen";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function ChatsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-ink-900 dark:text-white">Mensajes</h1>
      <ChatListScreen userId={currentUser.profile.id} />
    </div>
  );
}
