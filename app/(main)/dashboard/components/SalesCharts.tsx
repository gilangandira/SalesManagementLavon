"use client";

import * as React from "react";
import { AreaChart, Area, XAxis, CartesianGrid, Legend } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export type SaleChartItem = {
  date: string;
  visited: number;
  deposited: number;
  booked: number;
};

type SalesChartsProps = {
  salesArea: SaleChartItem[];
  startDate: Date;
  endDate: Date;
};

const chartConfig = {
  visitors: {
    label: "Visited",
  },
  desktop: {
    label: "Deposited",
    color: "var(--primary)",
  },
  mobile: {
    label: "Booked",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export default function SalesCharts({
  salesArea,
  startDate,
  endDate,
}: SalesChartsProps) {
  const filteredData = salesArea.filter((item) => {
    const d = new Date(item.date);
    return d >= startDate && d <= endDate;
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-center gap-2 border-b py-5">
        <div>
          <CardTitle>Sales - Area Chart</CardTitle>
          <CardDescription>
            Sales trends over selected time range
          </CardDescription>
        </div>
        {/* <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              className={`px-3 py-1 rounded ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
              onClick={() => setTimeRange(range)}
            >
              {range === "7d"
                ? "Last 7 Days"
                : range === "30d"
                ? "Last 30 Days"
                : "Last 3 Months"}
            </button>
          ))}
        </div> */}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            width={window.innerWidth * 0.8}
            height={300}
            data={filteredData}
          >
            <defs>
              <linearGradient id="fillVisited" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDeposited" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-2)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-2)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillBooked" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />

            <Area
              dataKey="visited"
              stroke="var(--chart-1)"
              fill="url(#fillVisited)"
              type="monotone"
            />
            <Area
              dataKey="deposited"
              stroke="var(--chart-2)"
              fill="url(#fillDeposited)"
              type="monotone"
            />
            <Area
              dataKey="booked"
              stroke="var(--chart-3)"
              fill="url(#fillBooked)"
              type="monotone"
            />
            <Legend />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
