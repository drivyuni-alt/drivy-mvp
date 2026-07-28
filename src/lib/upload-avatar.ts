import { createClient } from "@/lib/supabase/client";

/** Shared by sign-up and profile-edit: uploads to the public `avatars` bucket under `<user_id>/...`. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
