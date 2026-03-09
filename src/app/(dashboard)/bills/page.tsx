"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Search, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface Sale {
  _id: string;
  invoiceNumber: string;
  customer: { name: string; phone: string };
  grandTotal: number;
  paymentMethod: string;
  createdAt: string;
  createdBy: { name: string };
}

export default function BillsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", search });
    const res = await fetch(`/api/sales?${params}`);
    const data = await res.json();
    setSales(data.sales ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchSales, 300);
    return () => clearTimeout(timer);
  }, [fetchSales]);

  return (
    <div className="space-y-6" aria-label="bills history page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
          <p className="text-muted-foreground text-sm">{total} invoices total</p>
        </div>
        <Button asChild aria-label="create new bill button">
          <Link href="/pos">
            <Receipt className="mr-2 h-4 w-4" /> New bill
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #, customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              aria-label="search bills input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading bills...
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 text-sm">
              <Receipt className="h-8 w-8 opacity-40" />
              <p>No bills found</p>
            </div>
          ) : (
            <Table aria-label="bills table">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Created by</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell className="font-mono text-xs font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sale.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{sale.customer.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentMethod === "cash" ? "secondary" : "default"} className="capitalize text-xs">
                        {sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.grandTotal)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sale.createdBy?.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(sale.createdAt), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild aria-label={`view bill ${sale.invoiceNumber}`}>
                        <Link href={`/bills/${sale._id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="previous page button">Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="next page button">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
