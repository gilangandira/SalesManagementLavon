"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

const API_URL = "http://localhost:8000/api/customers";
const CLUSTER_API = "http://localhost:8000/api/clusters";

interface Cluster {
  id: number;
  type: string;
  price: number;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams();

  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [openCluster, setOpenCluster] = useState(false);
  const [openCriteria, setOpenCriteria] = useState(false);

  const [form, setForm] = useState({
    nik: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    criteria: "",
    cicilan: "",
    cluster_id: "",
  });

  // Load existing customer + clusters
  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken();
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        const [clusterRes, customerRes] = await Promise.all([
          fetch(`${CLUSTER_API}?all=true`, { headers }),
          fetch(`${API_URL}/${id}`, { headers }),
        ]);

        const clusterJson = await clusterRes.json();
        const customerJson = await customerRes.json();

        setClusters(clusterJson.data);

        setForm({
          nik: customerJson.data.nik || "",
          name: customerJson.data.name || "",
          phone: customerJson.data.phone || "",
          email: customerJson.data.email || "",
          address: customerJson.data.address || "",
          criteria: customerJson.data.criteria || "",
          cicilan: customerJson.data.cicilan || "",
          cluster_id: customerJson.data.cluster_id
            ? String(customerJson.data.cluster_id)
            : "",
        });
      } catch (err) {
        console.error("Error load:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update");

      router.push("/customers");
    } catch (err) {
      console.error(err);
      setSubmitLoading(false);
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-1 flex-col p-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Customer</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* NIK */}
              <div className="flex items-center gap-4">
                <Label className="w-32">NIK</Label>
                <Input
                  value={form.nik}
                  onChange={(e) => setForm({ ...form, nik: e.target.value })}
                />
              </div>

              {/* NAME */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* PHONE */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* EMAIL */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* ADDRESS */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>

              {/* CICILAN */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Cicilan</Label>
                <Input
                  value={form.cicilan}
                  onChange={(e) =>
                    setForm({ ...form, cicilan: e.target.value })
                  }
                />
              </div>

              {/* CRITERIA COMBOBOX */}
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
                        {form.criteria || "Select Criteria..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search criteria..." />

                        <CommandList>
                          <CommandEmpty>No criteria found.</CommandEmpty>

                          <CommandGroup>
                            {["Deposited", "Booked", "Visited"].map((item) => (
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

              {/* CLUSTER COMBOBOX */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Cluster</Label>

                <div className="w-full">
                  <Popover open={openCluster} onOpenChange={setOpenCluster}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCluster}
                        className="w-full justify-between"
                      >
                        {form.cluster_id
                          ? (() => {
                            const selected = clusters.find(
                              (c) => String(c.id) === form.cluster_id
                            );
                            return selected
                              ? `${selected.type} — Rp ${selected.price}`
                              : "Select Cluster...";
                          })()
                          : "Select Cluster..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search cluster..." />

                        <CommandList>
                          <CommandEmpty>No cluster found.</CommandEmpty>

                          <CommandGroup>
                            {clusters.map((cl) => (
                              <CommandItem
                                key={cl.id}
                                value={String(cl.id)}
                                onSelect={(value) => {
                                  setForm({ ...form, cluster_id: value });
                                  setOpenCluster(false);
                                }}
                              >
                                {cl.type} — Rp {cl.price}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    form.cluster_id === String(cl.id)
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

              <Button type="submit" className="mt-4" disabled={submitLoading}>
                {submitLoading ? "Updating..." : "Update Customer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
