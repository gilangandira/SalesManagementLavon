import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { CircleDollarSign, Store, UsersRound } from "lucide-react";

type SummaryProps = {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    monthly_growth_rate: number;
  };
};

export default function DashboardSummary({ summary }: SummaryProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">
            RP.{" "}
            {Number(summary.total_revenue ?? 0).toLocaleString("id-ID", {
              minimumFractionDigits: 2,
            })}</div>
          <p className="text-xs text-muted-foreground">
            Total payment received
          </p>
        </CardContent>

      </Card>

      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Store className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>

          <div className="text-2xl font-bold">
            {summary.total_orders ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            Total orders received
          </p>
        </CardContent>
      </Card>

      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>

          <UsersRound className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>

          <div className="text-2xl font-bold">
            {summary.total_customers ?? 0}</div>
          <p className="text-xs text-muted-foreground">
            Total customers received
          </p>
        </CardContent>
      </Card>


      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>

          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.monthly_growth_rate != null
              ? `${summary.monthly_growth_rate.toFixed(2)}%`
              : "-"}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
