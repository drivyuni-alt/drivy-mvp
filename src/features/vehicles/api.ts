import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/lib/supabase/types";

import type { CreateVehicleInput } from "./types";

export async function createVehicle(input: CreateVehicleInput): Promise<Tables<"vehicles">> {
  const supabase = createClient();
  const payload: TablesInsert<"vehicles"> = {
    owner_id: input.ownerId,
    make: input.make,
    model: input.model,
    color: input.color,
    plate: input.plate,
    seats: input.seats,
  };
  const { data, error } = await supabase.from("vehicles").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}
