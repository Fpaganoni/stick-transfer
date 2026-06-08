"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface StatusBarDatum {
  label: string;
  value: number;
  color: string;
}

interface StatusBarChartProps {
  data: StatusBarDatum[];
  layout?: "horizontal" | "vertical";
}

const chartConfig = {
  value: { label: "Count" },
} satisfies ChartConfig;

export function StatusBarChart({ data, layout = "vertical" }: StatusBarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
      <BarChart
        data={data}
        layout={isVertical ? "vertical" : "horizontal"}
        margin={{ left: isVertical ? 12 : 0, right: 12, top: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={!isVertical} vertical={isVertical} />
        {isVertical ? (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={110}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} />
          </>
        )}
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="value" radius={4}>
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
