"use client";

import { getToken } from "@/lib/auth";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { DashboardCharts } from "@/components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, Users, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const SALES_API = "http://localhost:8000/api/sales?all=1";

interface Sale {
  id: number;
  price: number;
  payment_amount: number;
  status: string;
  payment_status_info?: {
    status: string;
    label: string;
    color: string;
  };
  sale_date: string;
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
        const token = await getToken();
        fetch(SALES_API, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        })
        .then((res) => res.json())
        .then((json) => {
            if (json.success) {
            // Handle response format if it's direct array or paginated
            const list = Array.isArray(json.data) ? json.data : json.data.data;
            setSales(list || []);
            }
        })
        .catch((err) => {
            console.error(err);
            toast.error("Failed to load dashboard data");
        })
        .finally(() => setLoading(false));
    };
    fetchSales();
  }, []);

  // Calculate Metrics
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.payment_amount), 0);
  const totalPotential = sales.reduce((acc, s) => acc + Number(s.price), 0);
  const totalReceivables = totalPotential - totalRevenue;
  
  const overdueCount = sales.filter(s => 
     s.payment_status_info?.status === 'Overdue' || 
     (s.payment_status_info?.status === 'Due Soon') // Optional: count due soon as warning
  ).length;

  const strictOverdueCount = sales.filter(s => s.payment_status_info?.status === 'Overdue').length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <SidebarInset>
      <SiteHeader />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Total payment received
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receivables</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalReceivables)}</div>
              <p className="text-xs text-muted-foreground">
                Remaining to be collected
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Accounts</CardTitle>
              <AlertCircle className={`h-4 w-4 ${strictOverdueCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${strictOverdueCount > 0 ? 'text-red-500' : ''}`}>{strictOverdueCount}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
             <div className="flex items-center justify-center p-12">
               <Progress className="w-[60%]" />
             </div>
        ) : (
             <DashboardCharts salesData={sales} />
        )}
      </div>
    </SidebarInset>
  );
}
