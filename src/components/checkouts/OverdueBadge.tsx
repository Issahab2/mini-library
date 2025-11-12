import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface OverdueBadgeProps {
  isOverdue: boolean;
  overdueDays?: number;
  lateFeeAmount?: number | string | null;
}

export function OverdueBadge({ isOverdue, overdueDays = 0, lateFeeAmount }: OverdueBadgeProps) {
  if (!isOverdue) {
    return null;
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="size-3" />
      <span>
        {overdueDays} day{overdueDays !== 1 ? "s" : ""} overdue
      </span>
      {lateFeeAmount && (
        <span className="ml-1">
          (${typeof lateFeeAmount === "string" ? lateFeeAmount : lateFeeAmount.toFixed(2)})
        </span>
      )}
    </Badge>
  );
}

