import { redirect } from "next/navigation";

import { ChatThread } from "@/features/chat/components/ChatThread";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { id } = await params;

  return <ChatThread chatId={id} currentUserId={currentUser.profile.id} />;
}
