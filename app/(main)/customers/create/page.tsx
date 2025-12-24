"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/customers`;
const CLUSTER_API = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/clusters`;

// Definisi Tipe Data Cluster
interface Cluster {
  id: number;
  type: string;
  price: number;
  stock: number;
  customers_count: number;
}

export default function CreateCustomerPage() {
  const router = useRouter();

  // State Management
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [clusterLoading, setClusterLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openCriteria, setOpenCriteria] = useState(false);
  const [openMethod, setOpenMethod] = useState(false);

  // State Formulir Utama
  const [form, setForm] = useState({
    nik: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    criteria: "Visited", // Default status/kriteria (untuk Cash Bertahap)
    cicilan: "",
    cluster_id: "",
    payment_amount: 0,
    payment_method: "cash_bertahap", // "cash_bertahap" | "kpr"
    interest_rate: 0, // New field for interest
  });

  const isKPR = form.payment_method === "kpr"; // Cek apakah metode KPR

  // Konstanta untuk KPR
  const kprBF = 10_000_000; // Booking Fee tetap 10jt

  // Helper Format Rupiah
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  // Cari data cluster yang sedang dipilih untuk tahu harganya
  const selectedCluster = clusters.find((c: any) => String(c.id) === String(form.cluster_id));
  const price = selectedCluster ? selectedCluster.price : 0;

  // Kalkulasi KPR (DP 10%, Pinjaman 90%)
  const kprDP = price * 0.10;
  const kprLoan = price * 0.90;

  // Efek: Saat Metode Pembayaran Berubah
  useEffect(() => {
    if (form.payment_method === "kpr") {
      setForm(f => ({
        ...f,
        criteria: "Booked", // Jika KPR, status otomatis "Booked"
        payment_amount: kprBF, // Set Booking Fee otomatis 10jt
        cicilan: "0", // Cicilan diabaikan (urusan Bank)
        interest_rate: 0
      }));
    } else {
      // Jika kembali ke Cash Bertahap
      // Optional: Reset to Visited and 0 payment?
      setForm(f => ({
        ...f,
        criteria: "Visited", // Reset ke Visited
        payment_amount: 0,
        cicilan: "",
        interest_rate: 0
      }));
    }
  }, [form.payment_method]);


  // Efek: Ambil data Cluster saat load page
  useEffect(() => {
    async function loadClusters() {
      try {
        const token = await getToken();
        // Ambil semua cluster untuk dropdown
        const res = await fetch(`${CLUSTER_API}?all=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const json = await res.json();
        setClusters(json?.data ?? []);
      } catch (err) {
        console.error("Error loading clusters:", err);
        setClusters([]);
      } finally {
        setClusterLoading(false);
      }
    }

    loadClusters();
  }, []);

  // Kalkulasi Cicilan Bulanan untuk Cash Bertahap
  const deposit = Number(form.payment_amount) || 0;
  const cicilanVal = Number(form.cicilan) || 0;
  const rateVal = Number(form.interest_rate) || 0;

  let monthlyVal = 0;
  if (!isKPR && (price - deposit) > 0 && cicilanVal > 0) {
    const loan = price - deposit;
    if (rateVal > 0) {
      const r = (rateVal / 12) / 100;
      monthlyVal = (loan * r * Math.pow(1 + r, cicilanVal)) / (Math.pow(1 + r, cicilanVal) - 1);
    } else {
      monthlyVal = loan / cicilanVal;
    }
  }

  // Submit ke API
  async function handleSubmit(e: any) {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Error Response:", text);
        throw new Error(`Failed to create customer: ${text}`);
      }

      router.push("/customers"); // Sukses -> Balik ke list customer
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitLoading(false); // Biarkan user mencoba lagi jika gagal
    }
  }

  if (clusterLoading) return <p className="p-6">Loading...</p>;

  // Pilihan Metode Pembayaran
  const paymentMethods = [
    { value: "cash_bertahap", label: "Cash Bertahap" },
    { value: "kpr", label: "KPR" },
  ];

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-1 flex-col p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Customer</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Form Data Diri (Info Personal) */}
              <div className="flex items-center gap-4">
                <Label className="w-32">NIK</Label>
                <Input
                  value={form.nik}
                  onChange={(e) => setForm({ ...form, nik: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-32">Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* Pemilihan Cluster */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Cluster</Label>
                <div className="w-full">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {form.cluster_id
                          ? clusters.find((c: any) => c.id == form.cluster_id)
                            ?.type +
                          " — Rp " +
                          clusters.find((c: any) => c.id == form.cluster_id)
                            ?.price
                          : "-- Select Cluster --"}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search cluster..." />
                        <CommandList>
                          <CommandEmpty>No cluster found.</CommandEmpty>
                          <CommandGroup>
                            {/* Filter hanya cluster yang stoknya masih ada */}
                            {clusters
                              .filter((cl: any) => (cl.stock > cl.customers_count)) // Hanya tampilkan yang available
                              .map((cl: any) => (
                                <CommandItem
                                  key={cl.id}
                                  value={String(cl.id)}
                                  onSelect={(value) => {
                                    setForm({ ...form, cluster_id: value });
                                    setOpen(false);
                                  }}
                                >
                                  {cl.type} — Rp {cl.price} ({cl.stock - cl.customers_count} left)
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      form.cluster_id == cl.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Pemilihan Skema Pembayaran */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Scheme</Label>
                <div className="w-full">
                  <Popover open={openMethod} onOpenChange={setOpenMethod}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openMethod}
                        className="w-full justify-between"
                      >
                        {paymentMethods.find((m) => m.value === form.payment_method)?.label}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {paymentMethods.map((method) => (
                              <CommandItem
                                key={method.value}
                                value={method.value}
                                onSelect={(val) => {
                                  setForm({ ...form, payment_method: val });
                                  setOpenMethod(false);
                                }}
                              >
                                {method.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    form.payment_method === method.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Konten Dinamis Berdasarkan Skema Pembayaran */}
              {isKPR ? (
                // UI untuk KPR
                <div className="mt-2 p-4 rounded-lg border bg-card text-card-foreground shadow-sm space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold">Status</span>
                    <span className="font-bold text-blue-500">Booked (Auto)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Booking Fee (BF)</span>
                    <span className="font-bold text-blue-500">{formatCurrency(kprBF)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Down Payment (10%)</span>
                    <span className="font-mono">{formatCurrency(kprDP)}</span>
                  </div>

                  {/* Opsi untuk membayar DP sekalian */}
                  <div className="flex items-center space-x-2 py-2">
                    <input
                      type="checkbox"
                      id="includeDP"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onChange={(e) => {
                        const addDP = e.target.checked;
                        const newAmount = kprBF + (addDP ? kprDP : 0);
                        setForm(f => ({ ...f, payment_amount: newAmount }));
                      }}
                    />
                    <Label htmlFor="includeDP" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Pay Down Payment Now (+ {formatCurrency(kprDP)})
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t">
                    <Label className="text-xs font-semibold">Total Payment Amount</Label>
                    <Input
                      type="text"
                      value={form.payment_amount === 0 ? "" : new Intl.NumberFormat("id-ID").format(form.payment_amount)}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, "");
                        if (/^\d*$/.test(rawValue)) {
                          setForm({ ...form, payment_amount: Number(rawValue) });
                        }
                      }}
                      placeholder="Total Amount"
                      className="h-9"
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-muted-foreground">Bank Loan (90%)</span>
                    <span className="font-mono">{formatCurrency(kprLoan)}</span>
                  </div>
                </div>
              ) : (
                // UI untuk Cash Bertahap
                <>
                  <div className="flex items-center gap-4">
                    <Label className="w-32">Criteria</Label>
                    <div className="w-full">
                      <Popover open={openCriteria} onOpenChange={setOpenCriteria}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCriteria}
                            className="w-full justify-between"
                          >
                            {form.criteria ? form.criteria : "Select Criteria..."}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search criteria..." />
                            <CommandList>
                              <CommandEmpty>No criteria found.</CommandEmpty>
                              <CommandGroup>
                                {["Visited", "Booked", "Deposited"].map((item) => (
                                  <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={(value) => {
                                      setForm({ ...form, criteria: value });
                                      setOpenCriteria(false);
                                    }}
                                  >
                                    {item}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        form.criteria === item
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Input Jumlah Pembayaran Awal jika status Deposited/Booked */}
                  {(form.criteria === "Deposited" || form.criteria === "Booked") && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        <Label className="w-32">Amount</Label>
                        <Input
                          type="text"
                          value={form.payment_amount === 0 ? "" : new Intl.NumberFormat("id-ID").format(form.payment_amount)}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "");
                            if (/^\d*$/.test(rawValue)) {
                              setForm({ ...form, payment_amount: Number(rawValue) });
                            }
                          }}
                          placeholder="Enter payment amount"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <Label className="w-32">Cicilan</Label>
                    <Input
                      type="number"
                      value={form.cicilan}
                      onChange={(e) =>
                        setForm({ ...form, cicilan: e.target.value })
                      }
                      placeholder="e.g. 12 months"
                    />
                  </div>

                  {(form.criteria === "Deposited" || form.criteria === "Booked") && (
                    <div className="flex items-center gap-4">
                      <Label className="w-32">Bunga (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.interest_rate === 0 ? "" : form.interest_rate}
                        onChange={(e) =>
                          setForm({ ...form, interest_rate: Number(e.target.value) })
                        }
                        placeholder="e.g. 11.5"
                      />
                    </div>
                  )}

                  {/* Estimasi Cicilan Bulanan */}
                  {monthlyVal > 0 && (
                    <div className="ml-36 text-sm text-muted-foreground p-2 border rounded bg-muted/20">
                      Est. Monthly: <span className="font-semibold text-green-600">{formatCurrency(monthlyVal)}</span>
                      <span className="block text-xs mt-1 text-gray-500">
                        ({formatCurrency(price)} - {formatCurrency(deposit)}) / {cicilanVal} months
                      </span>
                    </div>
                  )}
                </>
              )}

              <Button type="submit" className="mt-6" disabled={submitLoading}>
                {submitLoading ? "Saving..." : "Create Customer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
