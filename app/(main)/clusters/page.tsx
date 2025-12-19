"use client";

import { useEffect, useState } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/button-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cuboid, Home, Map } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { getToken } from "@/lib/auth";

// Helper: Fungsi untuk memformat angka menjadi format mata uang Rupiah (IDR)
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

// Tipe data untuk statistik Cluster
type ClusterStats = {
  total_types: number; // Jumlah total tipe cluster
  most_popular: string; // Cluster yang paling laku
  average_price: number; // Rata-rata harga unit
  breakdown: { name: string; value: number }[]; // Data untuk grafik (nama cluster & jumlah terjual)
};

export default function ClusterDashboard() {
  // State untuk menyimpan data statistik dan status loading
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect akan dijalankan sekali saat komponen pertama kali dimuat (mount)
  useEffect(() => {
    fetchStats();
  }, []);

  // Fungsi untuk mengambil data statistik dari API backend
  const fetchStats = async () => {
    try {
      const token = await getToken(); // Ambil token otentikasi
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/clusters/stats`, {
        headers: {
          Authorization: `Bearer ${token}`, // Sertakan token di header request
        }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data); // Simpan data ke state
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Matikan status loading setelah selesai
    }
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
          <h1 className="text-base font-medium">Cluster Dashboard</h1>

          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Konten Utama Dashboard */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">

        {/* Grid Kartu Statistik */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3 mt-4">
          {/* Kartu 1: Total Tipe Cluster */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Types</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_types ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                Cluster models
              </p>
            </CardContent>
          </Card>

          {/* Kartu 2: Cluster Paling Laris */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Selling</CardTitle>
              <Cuboid className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.most_popular ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                Most customers
              </p>
            </CardContent>
          </Card>

          {/* Kartu 3: Rata-rata Harga */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
              <Home className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.average_price ? formatCurrency(stats.average_price) : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Average unit price
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Area Grafik Penjualan per Tipe Cluster */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Sales by Type</h3>
          </div>
          <div className="p-6 pt-0 pl-2">
            <div className="h-[300px] w-full mt-4">
              {stats?.breakdown ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)' }}
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data</div>
              )}
            </div>
          </div>
        </div>

        {/* Info Tambahan Sederhana */}
        <div className="col-span-3 rounded-xl bg-muted/10 p-6 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="mb-2">Total Clusters Types</p>
            <p className="text-4xl font-bold text-primary">{stats?.total_types ?? 0}</p>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
