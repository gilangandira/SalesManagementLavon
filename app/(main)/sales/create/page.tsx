"use client";

import { getToken } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CUSTOMER_API = "http://localhost:8000/api/customers?all=1";
const CLUSTER_API = "http://localhost:8000/api/clusters?all=1";
const SALES_API = "http://localhost:8000/api/sales";

// Defines tipe data untuk Customer dan Cluster
interface Customer {
  id: number;
  name: string;
  nik: string;
  cluster_id: number;
}

interface Cluster {
  id: number;
  type: string;
  price: number;
}

export default function CreateSalePage() {
  const router = useRouter(); // Hook untuk navigasi
  const [loading, setLoading] = useState(false); // Status loading saat submit

  // State untuk menyimpan daftar customer dan cluster yang diambil dari API
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  // State untuk membuka/tutup dropdown (Popover)
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openCluster, setOpenCluster] = useState(false);

  // State utama untuk Formulir (Form)
  const [form, setForm] = useState({
    customer_id: "",
    cluster_id: "",
    price: 0,
    booking_date: new Date().toISOString().split("T")[0],
    sale_date: new Date().toISOString().split("T")[0],
    payment_amount: 0,
    cicilan_count: 12, // Default 12x cicilan untuk Cash Bertahap
    payment_method: "cash_bertahap", // Default metode pembayaran
  });

  // Perhitungan Otomatis untuk KPR
  const isKPR = form.payment_method === "kpr"; // Cek jika metode KPR dipilih
  const kprBF = 10_000_000; // Booking Fee KPR tetap 10jt
  const kprDP = form.price * 0.10; // DP KPR 10% dari harga
  const kprLoan = form.price * 0.90; // Plafond KPR 90% dari harga

  // Efek samping: Mengatur nilai pembayaran otomatis jika metode pembayaran berubah menjadi KPR
  useEffect(() => {
    if (form.payment_method === "kpr") {
      setForm((f) => ({
        ...f,
        payment_amount: 10_000_000, // Otomatis set Booking Fee 10jt
        // Cicilan count bisa diabaikan untuk KPR karena urusan Bank
      }));
    }
  }, [form.payment_method]);

  // Efek samping: Mengambil data Customer dan Cluster saat halaman pertama dimuat
  useEffect(() => {
    async function initData() {
      const token = await getToken();

      // Ambil data Customer
      fetch(CUSTOMER_API, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
        .then((r) => r.json())
        .then((j) => {
          const customers = j?.data?.data ?? j?.data ?? [];
          setCustomers(customers);
        })
        .catch((e) => {
          console.error('Failed to fetch customers', e);
          setCustomers([]);
        });

      // Ambil data Cluster
      fetch(CLUSTER_API, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
        .then((r) => r.json())
        .then((j) => setClusters(j.data ?? []))
        .catch((e) => {
          console.error('Failed to fetch clusters', e);
          setClusters([]);
        });
    }

    initData();
  }, []);

  // Otomatis mengisi harga saat Cluster dipilih
  useEffect(() => {
    if (form.cluster_id) {
      const cluster = clusters.find((c) => c.id === Number(form.cluster_id));
      if (cluster) {
        setForm((f) => ({ ...f, price: cluster.price }));
      }
    }
  }, [form.cluster_id, clusters]);

  // Menghitung sisa pembayaran (untuk Cash Bertahap)
  const remaining = form.price - form.payment_amount;

  // Fungsi Submit Formulir
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(SALES_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(form), // Kirim data form ke API
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Error Response:", text);
        throw new Error(`Failed to create sale: ${text}`);
      }

      router.push("/sales"); // Redirect ke halaman Sales setelah sukses
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to create sale");
    } finally {
      setLoading(false);
    }
  }

  // Helper format uang Rupiah
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-1 flex-col p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Create New Sale</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Pilihan Customer (Dropdown dengan Search) */}
              <div className="flex flex-col gap-2">
                <Label>Customer</Label>
                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full justify-between"
                    >
                      {form.customer_id
                        ? customers.find(
                          (c) => c.id === Number(form.customer_id)
                        )?.name
                        : "Select Customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setForm({
                                  ...form,
                                  customer_id: String(c.id),
                                  // Otomatis pilih cluster jika customer sudah terikat cluster
                                  cluster_id: c.cluster_id ? String(c.cluster_id) : form.cluster_id
                                });
                                setOpenCustomer(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.customer_id === String(c.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {c.name} - {c.nik}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Pilihan Metode Pembayaran */}
              <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
                <Label className="text-base font-semibold">Payment Method</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={form.payment_method === "cash_bertahap" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, payment_method: "cash_bertahap" })}
                    className="flex-1"
                  >
                    Cash Bertahap
                  </Button>
                  <Button
                    type="button"
                    variant={form.payment_method === "kpr" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, payment_method: "kpr" })}
                    className="flex-1"
                  >
                    KPR
                  </Button>
                </div>

                {/* Detail Informasi KPR (Hanya tampil jika KPR dipilih) */}
                {isKPR && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking Fee (BF)</span>
                      <span className="font-bold text-blue-700">{formatCurrency(kprBF)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Down Payment (DP 10%)</span>
                      <span className="font-bold">{formatCurrency(kprDP)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2">
                      <span className="text-gray-600">Bank Loan (90%)</span>
                      <span className="font-bold">{formatCurrency(kprLoan)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pilihan Cluster / Unit */}
              <div className="flex flex-col gap-2">
                <Label>Cluster / Unit</Label>
                <Popover open={openCluster} onOpenChange={setOpenCluster}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCluster}
                      className="w-full justify-between"
                    >
                      {form.cluster_id
                        ? clusters.find((c) => c.id === Number(form.cluster_id))
                          ?.type
                        : "Select Cluster..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search cluster..." />
                      <CommandList>
                        <CommandEmpty>No cluster found.</CommandEmpty>
                        <CommandGroup>
                          {clusters.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={String(c.id)} // workaround for command value
                              onSelect={() => {
                                setForm({ ...form, cluster_id: String(c.id) });
                                setOpenCluster(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.cluster_id === String(c.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {c.type} - {formatCurrency(c.price)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Input Tanggal */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Booking Date</Label>
                  <Input
                    type="date"
                    required
                    value={form.booking_date}
                    onChange={(e) =>
                      setForm({ ...form, booking_date: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Sale Date (Agreement)</Label>
                  <Input
                    type="date"
                    required
                    value={form.sale_date}
                    onChange={(e) =>
                      setForm({ ...form, sale_date: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Input Harga & Cicilan */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col gap-2">
                  <Label>Total Price (IDR)</Label>
                  <Input
                    type="text"
                    value={form.price === 0 ? "" : formatCurrency(form.price).replace("Rp", "").trim()}
                    readOnly // Hanya baca (otomatis dari Cluster)
                    className="bg-background font-bold"
                  />
                </div>

                {/* Tampilkan Input Cicilan HANYA jika bukan KPR */}
                {!isKPR && (
                  <div className="flex flex-col gap-2">
                    <Label>Cicilan Count (Months)</Label>
                    <Input
                      type="number"
                      required
                      value={form.cicilan_count}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cicilan_count: Number(e.target.value),
                        })
                      }
                    />
                    {/* Estimasi Cicilan per Bulan */}
                    {(form.price - form.payment_amount) > 0 && form.cicilan_count > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Est. Monthly: <span className="font-semibold text-blue-600">{formatCurrency((form.price - form.payment_amount) / form.cicilan_count)}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="flex flex-col gap-2">
                  <Label>{isKPR ? "Booking Fee (Fixed)" : "Deposit / Initial Payment (IDR)"}</Label>
                  <Input
                    type="text"
                    required
                    value={form.payment_amount === 0 ? "" : new Intl.NumberFormat("id-ID").format(form.payment_amount)}
                    onChange={(e) => {
                      // KPR: Pembayaran awal (Booking Fee) dikunci, tidak bisa diedit manual
                      if (isKPR) return;

                      // Cash Bertahap: User bisa input nominal
                      const rawValue = e.target.value.replace(/\./g, "");
                      if (/^\d*$/.test(rawValue)) {
                        setForm({
                          ...form,
                          payment_amount: Number(rawValue),
                        });
                      }
                    }}
                    readOnly={isKPR}
                    className={cn("font-semibold text-green-700", isKPR && "bg-gray-100")}
                  />
                </div>

                {/* Sisa Tagihan (Hanya untuk Cash Bertahap) */}
                {!isKPR && (
                  <div className="flex flex-col gap-2 justify-center">
                    <Label>Remaining Balance</Label>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(remaining)}
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Create Sale"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
