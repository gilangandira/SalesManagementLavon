import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset } from "@/components/ui/sidebar";
import { notFound } from "next/navigation";

import { cookies } from "next/headers";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://forestgreen-shrew-854212.hostingersite.com/public/api"}/customers`;

async function getCustomer(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch(`${API_URL}/${id}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json.data;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await getCustomer(id);

  if (!customer) return notFound();

  return (
    <SidebarInset>
      <SiteHeader></SiteHeader>
      <div className="flex flex-1 flex-col">
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              Customer Detail
              <CardTitle>
                <b>Name:</b> {customer.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue="item-1"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger>Customers Informations</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4 text-balance">
                    <b>NIK:</b> {customer.nik}
                    <b>Phone:</b> {customer.phone}
                    <b>Email:</b> {customer.email}
                    <b>Address:</b> {customer.address}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Status Detail</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4 text-balance">
                    <b>Status:</b> {customer.criteria ?? "-"}
                    <b>Cicilan:</b> {customer.cicilan ?? "-"}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Cluster Detail</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4 text-balance">
                    <b>Cluster:</b> {customer.cluster?.type ?? "-"}
                    <b>Price:</b> {customer.cluster?.price ?? "-"}
                    <b>Luast Tanah:</b> {customer.cluster?.luas_tanah ?? "-"}
                    <b>Luast Bangunan:</b>{" "}
                    {customer.cluster?.luas_bangunan ?? "-"}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
