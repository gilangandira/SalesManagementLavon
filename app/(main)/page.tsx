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

import SalesCharts, { SaleChartItem } from "../(main)/dashboard/components/SalesCharts";
import DashboardCharts, {
  Customer,
  ClusterRadarData,
} from "../(main)/dashboard/components/DashboardChart";
import SalesTable from "../(main)/dashboard/components/SalesTable";
import DashboardSummary from "../(main)/dashboard/components/DashboardSummary";
import { apiClient } from "@/lib/api-client";

// Struktur data untuk item penjualan dalam tabel
type SalesItem = {
  id: number;
  booking_date?: string;
  customer?: { name?: string };
  cluster?: { type?: string };
  price?: number;
  status?: string;
};

// Struktur respons dari API untuk Dashboard
type ApiResponse = {
  summary: {
    total_revenue: number; // Total pendapatan
    total_orders: number; // Total pesanan
    total_customers: number; // Total pelanggan
    monthly_growth_rate: number; // Pertumbuhan bulanan (%)
  };
  chart_data: SaleChartItem[]; // Data grafik penjualan
  cluster_radar: ClusterRadarData; // Data grafik radar cluster
  top_customers: Customer[]; // Data pelanggan terbaik
  sales: { data: SalesItem[] }; // Data penjualan terbaru
};

export default function SalesDashboard() {
  // State untuk menyimpan data dashboard
  const [data, setData] = useState<ApiResponse | null>(null);

  // State untuk filter tanggal (Awal bulan ini s/d Hari ini)
  const [start, setStart] = useState<Date>(startOfMonth(new Date()));
  const [end, setEnd] = useState<Date>(new Date());

  // Fungsi untuk mengambil data dari API laporan
  const fetchData = (s?: Date, e?: Date) => {
    const startDate = s ?? start; // Gunakan tanggal baru jika ada, atau gunakan state
    const endDate = e ?? end;

    // Request ke API dengan parameter rentang tanggal
    apiClient<ApiResponse>("/reports/sales", {
      params: {
        start: format(startDate, "yyyy-MM-dd"), // Format tanggal jadi YYYY-MM-DD
        end: format(endDate, "yyyy-MM-dd"),
      },
    })
      .then(setData) // Simpan hasil ke state 'data'
      .catch(console.error);
  };

  // Ambil data pertama kali saat halaman dibuka
  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return <p>Loading...</p>; // Tampilkan loading jika data belum ada

  // Handler saat tanggal awal dipilih
  const handleStartSelect = (date?: Date) => {
    if (!date) return;
    setStart(date);
    fetchData(date, end); // Langsung refresh data
  };

  // Handler saat tanggal akhir dipilih
  const handleEndSelect = (date?: Date) => {
    if (!date) return;
    setEnd(date);
    fetchData(start, date); // Langsung refresh data
  };

  return (
    <SidebarInset>
      {/* Header Halaman */}
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
              {/* Komponen Pemilih Tanggal (Date Picker) */}
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

      {/* Konten Dashboard */}
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

            {/* Ringkasan Statistik (Kartu Atas) */}
            <DashboardSummary summary={data.summary} />

            <div className="px-4 lg:px-6">
              {/* Grafik Area Penjualan */}
              <SalesCharts
                salesArea={data.chart_data}
                startDate={start}
                endDate={end}
              />
            </div>

            <div className="px-4 lg:px-6">
              {/* Grafik Radar Cluster & Daftar Top Customers */}
              <DashboardCharts
                clusterRadar={data.cluster_radar}
                topCustomers={data.top_customers}
              />
            </div>

            <div className="px-4 lg:px-6">
              {/* Tabel Data Penjualan Terbaru */}
              <SalesTable sales={data.sales.data} />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
