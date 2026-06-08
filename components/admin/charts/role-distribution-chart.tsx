"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RoleCount } from "@/types/models/admin";

const ROLE_COLORS: Record<string, string> = {
  PLAYER: "var(--primary)",
  COACH: "var(--accent)",
  CLUB: "var(--info)",
  SUPERADMIN: "var(--warning)",
};

const chartConfig = {
  PLAYER: { label: "Player", color: ROLE_COLORS.PLAYER },
  COACH: { label: "Coach", color: ROLE_COLORS.COACH },
  CLUB: { label: "Club", color: ROLE_COLORS.CLUB },
  SUPERADMIN: { label: "Superadmin", color: ROLE_COLORS.SUPERADMIN },
} satisfies ChartConfig;

interface RoleDistributionChartProps {
  data: RoleCount[];
}

export function RoleDistributionChart({ data }: RoleDistributionChartProps) {
  const formatted = data.map((entry) => ({
    ...entry,
    fill: ROLE_COLORS[entry.role] ?? "var(--foreground-muted)",
  }));

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="role" hideLabel />} />
        <Pie data={formatted} dataKey="count" nameKey="role" innerRadius={60} strokeWidth={4}>
          {formatted.map((entry) => (
            <Cell key={entry.role} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="role" />} />
      </PieChart>
    </ChartContainer>
  );
}
