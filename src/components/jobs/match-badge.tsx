import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { getMatchQuality, type MatchQuality } from "@/config/matching-weights";
import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

export interface MatchBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MatchBadge({
  score,
  showLabel = true,
  size = "md",
  className,
}: MatchBadgeProps) {
  const threshold = getMatchQuality(score);

  // Custom styling per quality tier
  const tierStyles: Record<
    MatchQuality,
    { badge: string; icon: React.ReactNode; text: string }
  > = {
    EXCELLENT: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
      icon: <Sparkles className="h-3 w-3 text-emerald-600" />,
      text: "text-emerald-700",
    },
    STRONG: {
      badge: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
      icon: <CheckCircle className="h-3 w-3 text-blue-600" />,
      text: "text-blue-700",
    },
    GOOD: {
      badge: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100",
      icon: <CheckCircle className="h-3 w-3 text-indigo-600" />,
      text: "text-indigo-700",
    },
    PARTIAL: {
      badge: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
      icon: <AlertCircle className="h-3 w-3 text-amber-600" />,
      text: "text-amber-700",
    },
    LOW: {
      badge: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
      icon: <AlertCircle className="h-3 w-3 text-rose-600" />,
      text: "text-rose-700",
    },
  };

  const currentTier = tierStyles[threshold.quality];

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-0.5 gap-1.5",
    lg: "text-sm px-3 py-1 gap-2",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold inline-flex items-center transition-colors border",
        sizeClasses[size],
        currentTier.badge,
        className
      )}
    >
      {currentTier.icon}
      <span>
        {Math.round(score)}%
        {showLabel && (
          <span className="font-medium ml-1">· {threshold.label}</span>
        )}
      </span>
    </Badge>
  );
}
