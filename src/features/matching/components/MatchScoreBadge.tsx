import { Badge } from "@/components/ui";

export function MatchScoreBadge({ score }: { score: number }) {
  const variant = score >= 90 ? "brand" : score >= 75 ? "success" : "neutral";
  return (
    <Badge variant={variant}>
      <span aria-hidden>⭐</span> {score}% Compatible
    </Badge>
  );
}
