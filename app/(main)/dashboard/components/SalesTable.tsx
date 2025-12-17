import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

type SalesItem = {
  id: number;
  booking_date?: string;
  customer?: { name?: string };
  cluster?: { type?: string };
  price?: number;
  status?: string;
};

export default function SalesTable({ sales }: { sales: SalesItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cluster</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.booking_date ?? "-"}</TableCell>
                <TableCell>{s.customer?.name ?? "-"}</TableCell>
                <TableCell>{s.cluster?.type ?? "-"}</TableCell>
                <TableCell>
                  RP.{" "}
                  {Number(s.price ?? 0).toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{s.status ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
