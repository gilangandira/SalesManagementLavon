// app/main/accounts/page.tsx
import { SidebarInset } from "@/components/ui/sidebar";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Table } from "lucide-react";
import { cookies } from "next/headers";

export default async function AccountsPage() {
  const token = (await cookies()).get("token")?.value;

  // Fetch user role
  const meRes = await fetch("http://localhost:8000/api/me", {
    headers: { AuTableHeadorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const me = await meRes.json();

  if (me.role !== "admin") {
    return (
      <div className="p-6">You do not have access to TableHeadis page.</div>
    );
  }

  // Fetch all users
  const usersRes = await fetch("http://localhost:8000/api/users", {
    headers: { AuTableHeadorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const users = await usersRes.json();

  // 💥 FIX: support array OR {data: []} OR error
  const userList = Array.isArray(users)
    ? users
    : Array.isArray(users.data)
    ? users.data
    : [];

  return (
    <SidebarInset>
      <h1 className="text-3xl font-bold">Account Management</h1>

      <Table className="w-full mt-6 border">
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="p-3 text-left">Name</TableHead>
            <TableHead className="p-3 text-left">Email</TableHead>
            <TableHead className="p-3 text-left">Role</TableHead>
            <TableHead className="p-3 text-left">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {userList.map((u: any) => (
            <TableRow key={u.id} className="border-t">
              <TableCell className="p-3">{u.name}</TableCell>
              <TableCell className="p-3">{u.email}</TableCell>
              <TableCell className="p-3">{u.role}</TableCell>
              <TableCell className="p-3 flex gap-3"></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SidebarInset>
  );
}
