"use client";

import { SiteHeader } from "@/components/site-header";
import { getToken } from "@/lib/auth";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/payments`;

interface Payment {
    id: number;
    amount: number;
    payment_date: string;
    method: string | null;
    note: string | null;
    sale: {
        customer: { name: string };
        cluster: { type: string; price: number };
    };
}

interface ApiResponse<T> {
    success: boolean;
    data: {
        data: T[];
        last_page: number;
    };
}

export default function PaymentHistoryPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [search, setSearch] = useState("");

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}?page=${page}&search=${search}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json: ApiResponse<Payment> = await res.json();
            if (json.success) {
                setPayments(json.data.data);
                setLastPage(json.data.last_page);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, search]);

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

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-col p-6 gap-6">
                <h1 className="text-2xl font-bold">Payment History</h1>

                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                        placeholder="Search note or customer..."
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                    />
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead>Cluster</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No payments found.</TableCell>
                                </TableRow>
                            ) : (
                                payments.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.payment_date}</TableCell>
                                        <TableCell>{p.sale?.customer?.name ?? "-"}</TableCell>
                                        <TableCell className="font-medium text-green-600">
                                            {formatCurrency(Number(p.amount))}
                                        </TableCell>
                                        <TableCell>{p.note ?? "-"}</TableCell>
                                        <TableCell>{p.sale?.cluster?.type ?? "-"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Pagination */}
                <Pagination>
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
                                <PaginationLink href="#" isActive={p === page} onClick={() => setPage(p)}>
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        {createPagination().slice(-1)[0] < lastPage && <PaginationItem><PaginationEllipsis /></PaginationItem>}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={() => page < lastPage && setPage(page + 1)}
                                className={page === lastPage ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </SidebarInset>
    );
}
