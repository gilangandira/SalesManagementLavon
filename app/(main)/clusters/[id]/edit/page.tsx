"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/clusters`;

export default function EditClusterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [form, setForm] = useState({
    type: "",
    luas_tanah: "",
    luas_bangunan: "",
    price: 0,
    stock: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();

        if (json.data) {
          setForm({
            type: json.data.type,
            luas_tanah: json.data.luas_tanah,
            luas_bangunan: json.data.luas_bangunan,
            price: Number(json.data.price),
            stock: Number(json.data.stock || 0),
          });
        }
      } catch (err) {
        console.error("Failed to load cluster", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error("Failed to update cluster");
      }

      router.push("/clusters");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to update cluster");
    } finally {
      setLoading(false);
    }
  }

  if (dataLoading) {
    return <div className="p-6">Loading cluster data...</div>;
  }

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-1 flex-col p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Edit Cluster</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Label className="w-40">Type</Label>
                <Input
                  required
                  placeholder="e.g. Type 36/60"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-40">Luas Tanah (m²)</Label>
                <Input
                  required
                  type="number"
                  placeholder="60"
                  value={form.luas_tanah}
                  onChange={(e) =>
                    setForm({ ...form, luas_tanah: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-40">Luas Bangunan (m²)</Label>
                <Input
                  required
                  type="number"
                  placeholder="36"
                  value={form.luas_bangunan}
                  onChange={(e) =>
                    setForm({ ...form, luas_bangunan: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-40">Stock</Label>
                <Input
                  required
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-40">Price (IDR)</Label>
                <Input
                  required
                  type="text"
                  placeholder="500000000"
                  value={form.price === 0 ? "" : new Intl.NumberFormat("id-ID").format(form.price)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(rawValue)) {
                      setForm({ ...form, price: Number(rawValue) });
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Update Cluster"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
