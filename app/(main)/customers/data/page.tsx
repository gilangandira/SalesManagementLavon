"use client";

import { SiteHeader } from "@/components/site-header";
import { getToken } from "@/lib/auth";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { Plus, Search, SearchIcon, TableCellsSplitIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
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
import { Check, ChevronsUpDown, Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/customers`;
const CLUSTER_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/clusters`;

// ===== Types =====
interface Cluster {
  id: number;
  type: string;
}

interface Customer {
  id: number;
  nik: string;
  name: string;
  phone: string;
  criteria: string; // Added criteria
  cluster?: Cluster & { price: number } | null; // Added price support
}

interface ApiResponse<T> {
  data: {
    data: T[];
    last_page: number;
  };
}

interface ClusterResponse {
  data: Cluster[];
}

// Helper to format currency
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [clusterFilter, setClusterFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(""); // Added status filter
  const [openCluster, setOpenCluster] = useState(false);
  const [openStatus, setOpenStatus] = useState(false); // Added status popover state
  const [canEdit, setCanEdit] = useState(false);

  const checkUserRole = async () => {
    try {
      const token = await getToken();
      // Fallback to simpler check or just assume if token exists we can verify me
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await res.json();
      // Admin and Marketing can edit
      setCanEdit(user.role === 'admin' || user.role === 'sales');
    } catch (e) { console.error(e); }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      const res = await fetch(
        `${API_URL}?page=${page}&search=${search}&cluster_id=${clusterFilter}&criteria=${statusFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch customers: ${res.statusText}`);
      }

      const json: ApiResponse<Customer> = await res.json();

      if (json.data && Array.isArray(json.data.data)) {
        setCustomers(json.data.data);
        setLastPage(json.data.last_page);
      } else {
        console.error("Unexpected API response format:", json);
        setCustomers([]);
        setLastPage(1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch cluster list
  useEffect(() => {
    const fetchClusters = async () => {
      const token = await getToken();
      try {
        const r = await fetch(`${CLUSTER_URL}?all=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          }
        });
        const j: ClusterResponse = await r.json();
        if (j.data) setClusters(j.data);
      } catch (err) {
        console.error("Failed to load clusters", err);
      }
    };
    fetchClusters();
  }, []);

  // Refetch when filters or page changed
  useEffect(() => {
    fetchCustomers();
  }, [page, search, clusterFilter, statusFilter]);

  // Check role on mount
  useEffect(() => {
    checkUserRole();
  }, []);

  // Generate pagination numbers (max 5)
  const createPagination = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(lastPage, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };
  async function handleDelete(id: number) {
    if (!confirm("Are you sure want to delete this customer?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/customers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete customer");
      }

      // refresh page setelah delete
      toast.success("Customer deleted");
      fetchCustomers();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  }

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}

          <div className="flex w-full justify-between items-center  space-x-4    ">

            <Input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-[409px]"
            />
            {canEdit &&
              <Link href="/customers/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New Customer
                </Button>
              </Link>
            }
          </div>
        </div>


        <div className="flex gap-2 w-full md:w-auto">
          {/* Filters */}
          {/* Status Filter */}
          <Popover open={openStatus} onOpenChange={setOpenStatus}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openStatus}
                className="w-[200px] justify-between"
              >
                {statusFilter || "All Status"}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setStatusFilter(""); setOpenStatus(false); setPage(1); }}>
                      <Check className={cn("mr-2 h-4 w-4", statusFilter === "" ? "opacity-100" : "opacity-0")} />
                      All Status
                    </CommandItem>
                    {["Visited", "Booked", "Deposited", "Process"].map((s) => (
                      <CommandItem key={s} value={s} onSelect={() => { setStatusFilter(s); setOpenStatus(false); setPage(1); }}>
                        <Check className={cn("mr-2 h-4 w-4", statusFilter === s ? "opacity-100" : "opacity-0")} />
                        {s}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Cluster Filter */}
          <Popover open={openCluster} onOpenChange={setOpenCluster}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCluster}
                className="w-[200px] justify-between"
              >
                {clusterFilter
                  ? clusters.find((c) => String(c.id) === clusterFilter)
                    ?.type
                  : "All Clusters"}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search cluster..." />
                <CommandList>
                  <CommandEmpty>No cluster found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all_clusters_option"
                      onSelect={() => {
                        setClusterFilter("");
                        setPage(1);
                        setOpenCluster(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          clusterFilter === ""
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      All Clusters
                    </CommandItem>
                    {clusters.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={String(c.id)} // workaround for command value
                        onSelect={() => {
                          setClusterFilter(String(c.id));
                          setPage(1);
                          setOpenCluster(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clusterFilter === String(c.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {c.type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

        </div>
      </div>

      {loading ? (
        <div className="p-6 flex flex-col gap-2 items-center justify-center h-64">
          <p className="text-muted-foreground animate-pulse">Loading customers...</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4">
          <div className="px-4 lg:px-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Cluster</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead >Actions</TableHead>}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 5 : 4} className="h-24 text-center">
                        No customer found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.nik}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{c.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{c.cluster?.type ?? "-"}</span>
                            {c.cluster?.price && (
                              <span className="text-xs text-muted-foreground">{formatCurrency(c.cluster.price)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.criteria === 'Booked' ? 'bg-green-100 text-green-800' :
                              c.criteria === 'Deposited' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {c.criteria}
                          </span>
                        </TableCell>

                        <TableCell>
                          {canEdit && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <a href={`/customers/${c.id}`}>
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <a href={`/customers/${c.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {createPagination().map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {createPagination().slice(-1)[0] < lastPage && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => page < lastPage && setPage(page + 1)}
                    className={
                      page === lastPage ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </SidebarInset>
  );
}
