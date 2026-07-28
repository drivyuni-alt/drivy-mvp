"use server";

import { revalidatePath } from "next/cache";

import { unlockAchievementsForUser } from "@/features/gamification/unlock-achievements";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/action-result";

import type { SubmitRatingInput } from "./types";

export async function submitRatingAction(input: SubmitRatingInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== input.raterId) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  const scores = [input.punctuality, input.friendliness, input.communication];
  if (input.driving != null) scores.push(input.driving);
  const overall = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  const { error: insertError } = await supabase.from("ratings").insert({
    trip_id: input.tripId,
    booking_id: input.bookingId,
    rater_id: input.raterId,
    ratee_id: input.rateeId,
    punctuality: input.punctuality,
    friendliness: input.friendliness,
    driving: input.driving,
    communication: input.communication,
    comment: input.comment || null,
  });
  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "Ya has valorado este viaje." };
    }
    return { success: false, error: insertError.message };
  }

  const admin = createAdminClient();
  const { data: ratee } = await admin.from("users").select("*").eq("id", input.rateeId).single();
  if (ratee) {
    const newCount = ratee.rating_count + 1;
    const newAvg = (ratee.rating_avg * ratee.rating_count + overall) / newCount;

    await admin
      .from("users")
      .update({ rating_avg: Number(newAvg.toFixed(2)), rating_count: newCount })
      .eq("id", input.rateeId);

    await admin.from("notifications").insert({
      user_id: input.rateeId,
      type: "new_rating",
      title: "Has recibido una valoración",
      body: `Te han valorado con ${overall.toFixed(1)} / 5.`,
      data: { trip_id: input.tripId, booking_id: input.bookingId },
    });

    // rating_avg just changed — re-check the "5 estrellas" style achievements.
    await unlockAchievementsForUser(admin, input.rateeId);
  }

  revalidatePath(`/trips/${input.tripId}`);
  return { success: true };
}
