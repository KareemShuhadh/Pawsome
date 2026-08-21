import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const VoteButton = ({
  voted,
  voteCount,
  busy,
  pulsing,
  onClick,
  dogName,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-bounce",
        voted
          ? "bg-primary text-primary-foreground shadow-glow"
          : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
      )}
      aria-label={
        voted
          ? `Remove your vote for ${dogName}`
          : `Vote for ${dogName}`
      }
    >
      <Heart
        className={cn(
          "w-4 h-4",
          voted && "fill-current",
          pulsing && "animate-pop"
        )}
      />

      <span className="tabular-nums">{voteCount}</span>
    </button>
  );
};
