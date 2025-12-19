"use client";


import { getToken } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
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
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/sales`;

interface Sale {
  id: number;
  sale_date: string;
  booking_date: string;
  price: number;
  payment_amount: number;
  status: string; // "Paid", "Process"
  cicilan_count: number;
  locked_type: string;
  monthly_installment: number;
  // New computed attribute
  payment_status_info: {
    status: string; // "Overdue", "Due Soon", "Normal", "Paid"
    label: string;
    color: string;
    next_due_date: string;
  };
  customer?: {
    name: string;
    phone: string;
  };
  cluster?: {
    type: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: {
    data: T[];
    last_page: number;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [openStatus, setOpenStatus] = useState(false);
  const [search, setSearch] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = await getToken();
        // Cek permission dari /api/me
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = await res.json();

        // Simpan role user untuk logika tampilan
        setUserRole(user.role);

        // Admin and Sales (Marketing) can create sales
        setCanCreate(user.role === 'admin' || user.role === 'sales');
      } catch (e) {
        console.error(e);
      }
    };
    checkUserRole();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const query = new URLSearchParams({
        page: page.toString(),
        search,
        status: statusFilter === "All Status" ? "" : statusFilter,
      });
      const res = await fetch(`${API_URL}?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json: ApiResponse<Sale> = await res.json();
      if (json.success) {
        setSales(json.data.data);
        setLastPage(json.data.last_page);
      }
    } catch (err) {
      console.error("Failed to fetch sales", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  // Generate pagination
  const createPagination = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(lastPage, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // Generate pagination
  async function handleDelete(id: number) {
    if (!confirm("Are you sure want to delete this sale record?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Sale deleted successfully");
      fetchSales();
    } catch (err) {
      toast.error("Failed to delete sale");
    }
  }

  const handleExport = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/reports/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_recap_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Sales data exported successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to export sales data");
    }
  };

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex items-center justify-between p-6 pb-2">
        <h1 className="text-2xl font-bold">Sales Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Excel
          </Button>
          {canCreate && (
            <Link href="/sales/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Sale
              </Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-6">
          <p>Loading transactions...</p>
          <Progress className="w-full mt-2" />
        </div>
      ) : (
        <div className="flex flex-col p-6 pt-2 gap-4">
          <div className="flex gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Customer or Unit..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="pl-9"
              />
            </div>

            <Popover open={openStatus} onOpenChange={setOpenStatus}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openStatus}
                  className="w-[180px] justify-between"
                >
                  {statusFilter || "All Status"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {["All Status", "Paid", "Process", "Overdue", "Due Soon", "Normal"].map((status) => (
                        <CommandItem
                          key={status}
                          value={status}
                          onSelect={(currentValue) => {
                            setStatusFilter(currentValue === "all status" ? "" : status);
                            setPage(1);
                            setOpenStatus(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              statusFilter === status || (status === "All Status" && statusFilter === "")
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {status}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Unit Type</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Next Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  {userRole !== 'sales' && (
                    <TableHead>Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-6">
                      No sales transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((s) => {
                    // Safety check if backend hasn't returned the appends yet (e.g. cache)
                    const info = s.payment_status_info || { label: s.status, color: 'gray', next_due_date: '-' };

                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium">{s.booking_date}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.sale_date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {s.customer?.name ?? "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.customer?.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.locked_type || s.cluster?.type}
                        </TableCell>
                        <TableCell>{formatCurrency(s.price)}</TableCell>
                        <TableCell className="font-medium">
                          <div className="text-green-600">{formatCurrency(s.payment_amount)}</div>
                          {(s.monthly_installment > 0) && (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(s.monthly_installment)}/mo
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{info.next_due_date}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-white whitespace-nowrap",
                              info.color === "red" && "bg-red-600 hover:bg-red-700",
                              info.color === "yellow" && "bg-yellow-600 hover:bg-yellow-700",
                              info.color === "green" && "bg-green-600 hover:bg-green-700",
                              info.color === "blue" && "bg-blue-600 hover:bg-blue-700",
                              info.color === "gray" && "bg-gray-500 hover:bg-gray-600"
                            )}
                          >
                            {info.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3">
                            {userRole !== 'sales' && (
                              <>
                                <Link
                                  href={`/sales/${s.id}/edit`}
                                  className="text-blue-600 font-medium text-sm"
                                >
                                  Pay
                                </Link>
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="text-red-600 text-sm"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => page > 1 && setPage(page - 1)}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
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
      )}
    </SidebarInset>
  );
}
