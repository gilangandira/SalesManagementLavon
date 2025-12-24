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
import { Pencil, X, Check } from "lucide-react";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/sales`;

interface Sale {
  id: number;
  price: number;
  monthly_installment: number;
  cicilan_count: number;
  interest_rate?: number;
  paid_principal?: number;
  paid_interest?: number;
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
  const [isEditingPayment, setIsEditingPayment] = useState(false); // New state for toggle

  const [form, setForm] = useState({
    add_payment: 0, // Input for adding amount
    payment_amount: 0, // Input for overriding existing amount
    price: 0,
    interest_rate: 0,
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
              payment_amount: Number(json.data.payment_amount), // Initialize with existing
              price: json.data.price,
              interest_rate: Number(json.data.interest_rate) || 0,
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
  const initialRemaining = sale ? sale.price - sale.payment_amount : 0; // Restored line
  const totalPaidAfterAdd = existingPayment + form.add_payment;
  const currentRemaining = form.price - totalPaidAfterAdd; // Renamed for clarity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.preventDefault();
    if (!isEditingPayment && form.add_payment <= 0) {
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
          add_payment: isEditingPayment ? 0 : form.add_payment, // If editing, don't add
          payment_amount: isEditingPayment ? form.payment_amount : undefined, // If editing, send override
          price: form.price,
          interest_rate: isEditingPayment ? form.interest_rate : undefined
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

  // Calculate Dynamic Preview of Monthly Installment if Editing DP
  let previewMonthly = monthlyInstallment;
  if (isEditingPayment && sale) {
    const newDP = form.payment_amount;
    const price = form.price; // or sale.price
    const remainingPrincipalAfterDP = price - newDP;
    const count = sale.cicilan_count;
    // Use the potentially edited interest rate
    const rate = form.interest_rate;

    if (remainingPrincipalAfterDP > 0 && count > 0) {
      if (rate > 0) {
        const r = (rate / 12) / 100;
        previewMonthly = (remainingPrincipalAfterDP * r * Math.pow(1 + r, count)) / (Math.pow(1 + r, count) - 1);
      } else {
        previewMonthly = remainingPrincipalAfterDP / count;
      }
    } else {
      previewMonthly = 0;
    }
  }

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
                  <span className={cn("font-bold text-blue-600", isEditingPayment && "text-amber-500")}>
                    {formatCurrency(previewMonthly)}/mo
                    {isEditingPayment && <span className="text-xs block text-muted-foreground font-normal">(New Estimate)</span>}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Based on initial agreement.</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">Terms</Label>
                  {!isEditingPayment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => setIsEditingPayment(true)}
                      className="h-8 text-xs text-blue-600 hover:text-blue-800"
                      title="Edit Terms"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit Terms
                    </Button>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label className="text-xs">Total Deposit (DP)</Label>
                    {isEditingPayment ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={form.payment_amount === 0 ? "" : new Intl.NumberFormat("id-ID").format(form.payment_amount)}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, "");
                            if (/^\d*$/.test(rawValue)) {
                              setForm({ ...form, payment_amount: Number(rawValue) });
                            }
                          }}
                          className="font-bold h-9"
                        />
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
                        {formatCurrency(existingPayment)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 w-1/3">
                    <Label className="text-xs">Interest Rate (%)</Label>
                    {isEditingPayment ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={form.interest_rate}
                          onChange={(e) => setForm({ ...form, interest_rate: Number(e.target.value) })}
                          className="font-bold h-9"
                          placeholder="0"
                        />
                        <Button size="icon" variant="ghost" type="button" onClick={() => setIsEditingPayment(false)} className="h-9 w-9">
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
                        {sale?.interest_rate ?? 0}%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isEditingPayment && (
                <Card className="flex flex-col gap-2 p-4 border border-blue-200 bg-muted/50 rounded-lg">
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
                </Card >
              )}

              {/* Detailed Breakdown Section */}
              <div className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment Breakdown</h4>

                {sale && sale.monthly_installment > 0 && sale.cicilan_count > 0 && (
                  (() => {
                    // PV Logic for Initial Principal
                    const rate = isEditingPayment ? form.interest_rate : (sale.interest_rate ?? 0);
                    // Use dynamic preview monthly if editing, otherwise stored value
                    const monthly = isEditingPayment ? previewMonthly : (Number(sale.monthly_installment) || 0);
                    const months = Number(sale.cicilan_count) || 0;

                    let initialPrincipalLoan = 0;
                    if (rate > 0) {
                      const r = (rate / 12) / 100;
                      initialPrincipalLoan = monthly * (1 - Math.pow(1 + r, -months)) / r;
                    } else {
                      initialPrincipalLoan = monthly * months;
                    }

                    // Backend provides paid_principal and paid_interest (if available)
                    // Fallback: If paid_principal is undefined or 0 (and total paid > 0), 
                    // it means old data without split. We warn or just show total.
                    // Ideally we use the new backend fields.
                    let paidPrincipal = sale.paid_principal ?? 0;
                    let paidInterest = sale.paid_interest ?? 0;

                    // Fallback for Legacy Data or Initial DP:
                    if (paidPrincipal === 0 && sale.payment_amount > 0) {
                      paidPrincipal = sale.payment_amount;
                      paidInterest = 0;
                    }

                    // Reactive Overrides when Editing
                    if (isEditingPayment) {
                      // If editing, the Input Value is the new "Total Paid".
                      // We assume this new amount is effectively the new DP (Principal).
                      paidPrincipal = form.payment_amount;
                      // We might want to reset interest paid to 0 if we are changing the base deal?
                      // or keep it? If we change DP, usually it's before installments.
                      // So let's assume interest is 0 or unchanged.
                    }

                    const remainingPrincipal = initialPrincipalLoan - paidPrincipal;

                    // Total Interest
                    const totalInterest = (monthly * months) - initialPrincipalLoan;
                    const remainingInterest = totalInterest - paidInterest;

                    // For "Adding Now", we estimate split simply for display?
                    // Or just show total adding.

                    // The Real "Remaining Balance from Developer" is Remaining Principal?
                    // Or is it (Price - Paid)?
                    // If Price = 1.5B (which includes margin?), or Price is Loan Amount?
                    // App uses Price as Base.
                    // If Price IS the Principal.
                    const basePrice = form.price;
                    // If calculated PV differs from Price, use Price?
                    // Usually Price is the Principal.
                    const effectivePrincipal = basePrice;

                    const realRemainingPrincipal = effectivePrincipal - paidPrincipal;
                    const realRemainingTotal = realRemainingPrincipal + remainingInterest;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Original Principal (Harga Pokok):</span>
                          <span>{formatCurrency(effectivePrincipal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Paid Principal (Pokok Dibayar):</span>
                          <span className="text-green-600">-{formatCurrency(paidPrincipal)}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed pt-1 font-semibold">
                          <span>Remaining Principal (Sisa Pokok):</span>
                          <span>{formatCurrency(realRemainingPrincipal)}</span>
                        </div>

                        <div className="mt-2 pt-2 border-t">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Est. Total Interest (Total Bunga):</span>
                            <span>{formatCurrency(totalInterest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paid Interest (Bunga Dibayar):</span>
                            <span className="text-green-600">-{formatCurrency(paidInterest)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-dashed pt-1">
                            <span>Remaining Interest (Sisa Bunga):</span>
                            <span>{formatCurrency(remainingInterest)}</span>
                          </div>
                        </div>

                        {(!isEditingPayment && form.add_payment > 0) && (
                          <div className="flex justify-between mt-2 pt-2 border-t font-semibold text-blue-600">
                            <span>Adding Now (Total Bayar):</span>
                            <span>{formatCurrency(form.add_payment)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm mt-4">
                          <span className="font-semibold">Remaining Balance (Sisa Tagihan Total)</span>
                          <span className={cn("text-xl font-bold", realRemainingTotal <= 0 ? "text-green-600" : "text-red-600")}>
                            {realRemainingTotal <= 0 ? "PAID OFF" : formatCurrency(realRemainingTotal)}
                          </span>
                        </div>
                      </>
                    );
                  })()
                )}
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
                  {submitting ? "Processing..." : (isEditingPayment ? "Update Payment Info" : "Confirm Payment")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
