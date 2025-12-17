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
import { Plus, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit } from "lucide-react";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const API_URL = `${BASE_URL}/clusters`;

// ===== Tipe Data (Types) =====
// Mendefinisikan struktur data Cluster sesuai dengan database
interface Cluster {
  id: number;
  type: string;
  luas_tanah: number;
  luas_bangunan: number;
  price: number;
  stock: number;
  customers_count: number;
}

// Format respons dari API untuk list data dengan pagination
interface ApiResponse<T> {
  success: boolean;
  data: {
    data: T[];
    last_page: number;
  };
}

// Komponen Utama Halaman Daftar Cluster
export default function ClustersPage() {
  // State manajemen
  const [clusters, setClusters] = useState<Cluster[]>([]); // Menyimpan daftar cluster
  const [loading, setLoading] = useState<boolean>(true); // Indikator loading
  const [page, setPage] = useState<number>(1); // Halaman aktif
  const [lastPage, setLastPage] = useState<number>(1); // Total halaman
  const [search, setSearch] = useState<string>(""); // Kata kunci pencarian
  const [isAdmin, setIsAdmin] = useState(false); // Status apakah user adalah admin

  // useEffect dijalankan setiap kali 'page' atau 'search' berubah
  useEffect(() => {
    checkUserRole();
    fetchClusters();
  }, [page, search]);

  // Fungsi untuk mengecek role user saat ini (apakah admin atau bukan)
  const checkUserRole = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await res.json();
      setIsAdmin(user.role === 'admin'); // Set true jika role adalah admin
    } catch (e) { console.error(e); }
  };

  // Fungsi mengambil data cluster dari API
  const fetchClusters = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // Request ke API dengan parameter page dan search
      const res = await fetch(`${API_URL}?page=${page}&search=${search}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json: ApiResponse<Cluster> = await res.json();

      if (json.success) {
        setClusters(json.data.data || []);
        setLastPage(json.data.last_page || 1);
      }
    } catch (err) {
      console.error("Failed to fetch clusters", err);
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate nomor halaman untuk pagination (Maksimal 5 tombol halaman)
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

  // Fungsi menghapus cluster
  async function handleDelete(id: number) {
    if (!confirm("Are you sure want to delete this cluster?")) return; // Konfirmasi user

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete cluster");
      }

      // Refresh halaman / ambil ulang data setelah hapus berhasil
      fetchClusters();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  }

  // Format angka ke mata uang Rupiah
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <SidebarInset>
      <SiteHeader />

      <div className="flex items-center justify-between p-6 pb-2">
        <h1 className="text-2xl font-bold">Clusters</h1>
      </div>

      <div className="flex w-full  items-center space-x-2 px-6 pb-4 justify-between">
        {/* Input Pencarian */}
        <Input
          type="text"
          placeholder="Search cluster type..."
          value={search}
          onChange={(e) => {
            setPage(1); // Reset ke halaman 1 saat mencari
            setSearch(e.target.value);
          }}
          className="max-w-sm"
        />
        {/* Tombol Tambah Cluster (Hanya Admin) */}
        {isAdmin &&
          <Link href="/clusters/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Clusters
            </Button>
          </Link>
        }
      </div>

      {loading ? (
        // Tampilan saat Loading
        <div className="flex h-64 w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading clusters...</p>
          </div>
        </div>
      ) : (
        // Tampilan Tabel Data
        <div className="flex flex-1 flex-col">
          <div className="px-4 lg:px-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>

                    <TableHead>Luas Tanah (m²)</TableHead>
                    <TableHead>Luas Bangunan (m²)</TableHead>
                    <TableHead>Stock (Left)</TableHead>
                    <TableHead>Price</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}

                  </TableRow>
                </TableHeader>

                <TableBody>
                  {clusters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center p-4">
                        No clusters found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clusters.map((c) => {
                      // Hitung sisa stok
                      const left = c.stock - c.customers_count;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.type}</TableCell>

                          <TableCell>{c.luas_tanah} m²</TableCell>
                          <TableCell>{c.luas_bangunan} m²</TableCell>
                          <TableCell>
                            {/* Warna merah jika stok habis, hijau jika masih ada */}
                            <span className={left <= 0 ? "text-red-500 font-bold" : "text-green-600 font-medium"}>
                              {left}
                            </span>
                            <span className="text-muted-foreground text-xs ml-1">
                              / {c.stock}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(c.price)}</TableCell>

                          <TableCell>
                            {/* Aksi Edit/Delete (Hanya Admin) */}
                            {isAdmin && (
                              <div className="flex gap-2 items-center">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/clusters/${c.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(c.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

            </Card>
            {/* PAGINATION / Navigasi Halaman */}
            <Pagination className="mt-4 pb-8">
              <PaginationContent>
                {/* Previous */}
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {/* Page numbers */}
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

                {/* Ellipsis */}
                {createPagination().slice(-1)[0] < lastPage && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Next */}
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
