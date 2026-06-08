import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value?: number | string;
  icon: LucideIcon;
  delta?: string;
  iconClassName?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, icon: Icon, delta, iconClassName, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="size-10 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-foreground-muted">{label}</p>
          <p className="text-3xl font-bold">{value ?? "—"}</p>
          {delta ? (
            <Badge variant="outline" className="border-success text-success">
              {delta}
            </Badge>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
            iconClassName
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
