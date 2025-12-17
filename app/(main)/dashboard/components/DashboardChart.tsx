"use client";

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

import { CartesianGrid, XAxis, Legend, BarChart, Bar } from "recharts";

export type ClusterRadarData = {
  labels: string[];
  totals: number[];
};

type DashboardChartsProps = {
  clusterRadar: ClusterRadarData;
  topCustomers: any[];
};
export type Customer = {
  id: number;
  name: string;
  sales_sum_price?: number | null;
};

const clusterChartConfig = {
  cluster: { label: "Cluster Sales", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function DashboardCharts({
  clusterRadar,
  topCustomers,
}: DashboardChartsProps) {
  // API kamu SUDAH mengembalikan 6 cluster teratas
  // jadi kita cukup mapping ke format recharts
  const sortedClusters = clusterRadar.labels.map((label, idx) => ({
    cluster: label,
    total: clusterRadar.totals[idx],
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* ===========================
        CLUSTER SALES BAR CHART
    ============================ */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Cluster Sales</CardTitle>
          <CardDescription>Top 6 clusters by sales volume</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={clusterChartConfig}
            className="h-[260px] w-full"
          >
            <BarChart width={undefined} height={260} data={sortedClusters}>
              <defs>
                <linearGradient id="fillClusterBar" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.2}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="cluster"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => `${value} Cluster`}
                  />
                }
              />

              <Bar
                dataKey="total"
                fill="url(#fillClusterBar)"
                stroke="var(--chart-1)"
                radius={[6, 6, 0, 0]}
              />

              <Legend />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ===========================
        TOP CUSTOMERS TABLE
    ============================ */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Top 5 Customers</CardTitle>
          <CardDescription>Based on total purchase amount</CardDescription>
        </CardHeader>

        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c: any) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">
                    Rp {Number(c.sales_sum_price ?? 0).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
