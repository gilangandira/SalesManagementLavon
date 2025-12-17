"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/button-toggle";

import SalesCharts, { SaleChartItem } from "./components/SalesCharts";
import DashboardCharts, {
  Customer,
  ClusterRadarData,
} from "./components/DashboardChart";
import SalesTable from "./components/SalesTable";
import DashboardSummary from "./components/DashboardSummary";
import { apiClient } from "@/lib/api-client";

type SalesItem = {
  id: number;
  booking_date?: string;
  customer?: { name?: string };
  cluster?: { type?: string };
  price?: number;
  status?: string;
};

type ApiResponse = {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    monthly_growth_rate: number;
  };
  chart_data: SaleChartItem[];
  cluster_radar: ClusterRadarData;
  top_customers: Customer[];
  sales: { data: SalesItem[] };
};

export default function SalesDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [start, setStart] = useState<Date>(startOfMonth(new Date()));
  const [end, setEnd] = useState<Date>(new Date());

  const fetchData = (s?: Date, e?: Date) => {
    const startDate = s ?? start;
    const endDate = e ?? end;

    apiClient<ApiResponse>("/reports/sales", {
      params: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
      },
    })
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <p>Loading...</p>;

  const handleStartSelect = (date?: Date) => {
    if (!date) return;
    setStart(date);
    fetchData(date, end);
  };
  const handleEndSelect = (date?: Date) => {
    if (!date) return;
    setEnd(date);
    fetchData(start, date);
  };

  return (
    <SidebarInset>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">Dashboard</h1>

          <div className="ml-auto flex items-center gap-2">
            <div className="ml-auto flex items-center gap-2">
              {/* Date Picker */}

              {[
                { date: start, onSelect: handleStartSelect },
                { date: end, onSelect: handleEndSelect },
              ].map(({ date, onSelect }, idx) => (
                <Popover key={idx}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      data-empty={!date}
                      className="data-[empty=true]:text-muted-foreground w-[220px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={onSelect}
                    />
                  </PopoverContent>
                </Popover>
              ))}
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DashboardSummary summary={data.summary} />
            <div className="px-4 lg:px-6">
              {/* Sales Charts */}
              <SalesCharts
                salesArea={data.chart_data}
                startDate={start}
                endDate={end}
              />
            </div>
            <div className="px-4 lg:px-6">
              {/* Cluster & Top Customers */}
              <DashboardCharts
                clusterRadar={data.cluster_radar}
                topCustomers={data.top_customers}
              />
            </div>

            <div className="px-4 lg:px-6">
              {/* Sales Table */}
              <SalesTable sales={data.sales.data} />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
