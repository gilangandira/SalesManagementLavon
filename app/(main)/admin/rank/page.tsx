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
import { Trophy, TrendingUp, DollarSign } from "lucide-react";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/rankings`;

interface RankUser {
    id: number;
    name: string;
    email: string;
    sales_count: number;
    sales_sum_price: number; // Revenue
}

export default function RankPage() {
    const [rankings, setRankings] = useState<RankUser[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await getToken();
                const res = await fetch(API_URL, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success) {
                    setRankings(json.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const topPerformer = rankings.length > 0 ? rankings[0] : null;

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-col p-6 gap-6">
                <h1 className="text-2xl font-bold">Marketing Rankings</h1>

                {/* Top Performer Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    {topPerformer && (
                        <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-amber-800">Top Revenue</CardTitle>
                                <Trophy className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-900">{topPerformer.name}</div>
                                <p className="text-xs text-amber-700 font-semibold">{formatCurrency(Number(topPerformer.sales_sum_price))} Revenue</p>
                            </CardContent>
                        </Card>
                    )}

                    {rankings.length > 0 && (
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-indigo-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-indigo-800">Top Sales (Units)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-indigo-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-900">
                                    {rankings.reduce((prev, current) => (prev.sales_count > current.sales_count) ? prev : current).name}
                                </div>
                                <p className="text-xs text-indigo-700 font-semibold">
                                    {rankings.reduce((prev, current) => (prev.sales_count > current.sales_count) ? prev : current).sales_count} Sales Generated
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Leaderboard</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Total Sales (Units)</TableHead>
                                <TableHead>Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : rankings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No data available.</TableCell>
                                </TableRow>
                            ) : (
                                rankings.map((user, index) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-bold">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                {user.sales_count} units
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-green-600">
                                            {formatCurrency(Number(user.sales_sum_price))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </SidebarInset>
    );
}
