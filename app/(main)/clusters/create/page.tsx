"use client";

import { useState } from "react";
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

export default function CreateClusterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "",
    luas_tanah: "",
    luas_bangunan: "",
    price: "",
    stock: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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
        throw new Error("Failed to create cluster");
      }

      router.push("/clusters");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to create cluster");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-1 flex-col p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Cluster</CardTitle>
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
                <Label className="w-40">Price (IDR)</Label>
                <Input
                  required
                  type="number"
                  placeholder="500000000"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="w-40">Stock (Units)</Label>
                <Input
                  required
                  type="number"
                  placeholder="10"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
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
                  {loading ? "Saving..." : "Create Cluster"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
