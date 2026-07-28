import type { Tables } from "@/lib/supabase/types";

export type { ActionResult } from "@/types/action-result";

export interface SubmitReportInput {
  reporterId: string;
  reportedUserId: string;
  tripId: string | null;
  reason: Tables<"reports">["reason"];
  details: string;
}

export const REPORT_REASON_LABELS: Record<Tables<"reports">["reason"], string> = {
  inappropriate_behavior: "Comportamiento inapropiado",
  unsafe_driving: "Conducción insegura",
  no_show: "No se presentó",
  harassment: "Acoso",
  fraud: "Fraude",
  other: "Otro",
};
