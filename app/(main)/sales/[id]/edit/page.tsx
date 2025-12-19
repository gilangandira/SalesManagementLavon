"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/sales`;

interface Sale {
  id: number;
  price: number;
  payment_amount: number;
  status: string;
  cluster?: { type: string };
  customer?: { name: string };
}

export default function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    add_payment: 0, // Input for adding amount
    price: 0,
  });

  const [monthlyInstallment, setMonthlyInstallment] = useState(0);

  useEffect(() => {
    async function loadSale() {
      const token = await getToken();
      fetch(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setSale(json.data);
            setForm({
              add_payment: 0, // Start with 0
              price: json.data.price,
            });
            setMonthlyInstallment(Number(json.data.monthly_installment) || 0);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    loadSale();
  }, [id]);

  const existingPayment = sale ? Number(sale.payment_amount) : 0;
  const totalPaidAfterAdd = existingPayment + form.add_payment;
  const remaining = form.price - totalPaidAfterAdd;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.add_payment <= 0) {
      toast.error("Please enter an amount to pay.");
      return;
    }

    setSubmitting(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        // Send add_payment to backend
        body: JSON.stringify({
          add_payment: form.add_payment,
          price: form.price
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Update failed");
      }

      router.push("/sales");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update payment");
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  if (loading) return <div className="p-6">Loading sale data...</div>;
  if (!sale) return <div className="p-6">Sale not found.</div>;

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-1 flex-col p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Add Payment</CardTitle>
            <p className="text-sm text-muted-foreground">
              {sale.customer?.name} - {sale.cluster?.type}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              <div className="p-4 bg-muted/50 rounded-lg flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Label>Estimated Monthly Installment</Label>
                  <span className="font-bold text-blue-600">{formatCurrency(monthlyInstallment)}/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">Based on initial agreement.</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Total Already Paid</Label>
                <div className="text-xl font-bold text-gray-700">
                  {formatCurrency(existingPayment)}
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4 border border-blue-200 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-blue-900">Payment Amount (Add)</Label>
                  {monthlyInstallment > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setForm({ ...form, add_payment: monthlyInstallment })}
                      className="h-7 text-xs bg-blue-200 text-blue-900 hover:bg-blue-300"
                    >
                      Pay 1 Month
                    </Button>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Enter amount..."
                  value={form.add_payment === 0 ? "" : new Intl.NumberFormat("id-ID").format(form.add_payment)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(rawValue)) {
                      setForm({ ...form, add_payment: Number(rawValue) });
                    }
                  }}
                  className="text-lg font-bold text-blue-700 border-blue-300 focus-visible:ring-blue-400"
                />
                <p className="text-xs text-muted-foreground">
                  This amount will be added to the total paid.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <span className="font-semibold">Remaining Balance (After Payment)</span>
                <span className={cn("text-xl font-bold", remaining <= 0 ? "text-green-600" : "text-red-600")}>
                  {remaining <= 0 ? "PAID OFF" : formatCurrency(remaining)}
                </span>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
