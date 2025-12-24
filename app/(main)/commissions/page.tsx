"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/commissions`;

export default function CommissionsPage() {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [error, setError] = useState("");

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError("");
            try {
                const token = await getToken();
                if (!token) {
                    router.push("/login"); // Auth Check
                    return;
                }

                const res = await fetch(`${API_URL}?month=${month}&year=${year}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                });

                if (res.status === 403 || res.status === 401) {
                    setError("Access Denied. Admin Only.");
                    setLoading(false);
                    return;
                }

                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    setData([]);
                }
            } catch (err) {
                console.error("Error fetching commissions:", err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [month, year, router]);

    // Generate Year Options (Current - 5 to Current + 1)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);

    if (error) {
        return (
            <SidebarInset>
                <SiteHeader />
                <div className="p-6 flex justify-center items-center h-full">
                    <Card className="max-w-md w-full border-red-200 bg-red-50 dark:bg-red-950/20">
                        <CardContent className="pt-6 text-center text-red-600 font-semibold">
                            {error}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        );
    }

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col p-6 gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Sales Commissions (1.2%)</h1>

                    <div className="flex gap-2">
                        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Commission Report: {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-center py-8 text-muted-foreground">Loading commission data...</p>
                        ) : data.length === 0 ? (
                            <p className="text-center py-8 text-muted-foreground">No sales found for this period.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sales Agent</TableHead>
                                        <TableHead className="text-right">Total Sales Count</TableHead>
                                        <TableHead className="text-right">Total Sales Value</TableHead>
                                        <TableHead className="text-right font-bold text-green-600">Total Commission (1.2%)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row: any) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{row.name}</span>
                                                    <span className="text-xs text-muted-foreground">{row.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{row.sales_count} Unit(s)</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.total_sales_value)}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600 text-lg">
                                                {formatCurrency(row.commission)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </SidebarInset>
    );
}
