import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/BottomNav";
import { Navbar } from "@/components/layout/Navbar";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar profile={currentUser.profile} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
