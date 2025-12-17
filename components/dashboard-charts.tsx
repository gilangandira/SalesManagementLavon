"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardChartsProps {
  salesData: any[];
}

export function DashboardCharts({ salesData }: DashboardChartsProps) {
  // Process Data for Charts
  
  // 1. Status Distribution
  const statusCounts = salesData.reduce((acc, curr) => {
    // If using the new payment_status_info from backend
    const status = curr.payment_status_info?.status || curr.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }));

  const COLORS = {
    "Paid": "#22c55e", // Green
    "Overdue": "#ef4444", // Red
    "Due Soon": "#eab308", // Yellow
    "Process": "#3b82f6", // Blue
    "Normal": "#3b82f6", // Blue
    "Unknown": "#9ca3af" // Gray
  };

  // 2. Monthly Sales (Revenue)
  // Group by sale_date month
  const salesByMonth = salesData.reduce((acc, curr) => {
    if (!curr.sale_date) return acc;
    const date = new Date(curr.sale_date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g. "Oct 2025"
    
    if (!acc[month]) acc[month] = { name: month, total: 0 };
    acc[month].total += Number(curr.price);
    return acc;
  }, {} as Record<string, any>);

  const barData = Object.values(salesByMonth);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Sales Revenue (Overview)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp ${value / 1000000}M`}
              />
              <Tooltip formatter={(value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(value as number)} />
              <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Payment Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
