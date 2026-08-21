import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const LoadingSpinner = ({
  size = "md",
  className,
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizes[size],
        className
      )}
    />
  );
};