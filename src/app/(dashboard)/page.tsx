"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, Eye, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  todaySales: number;
  todayProfit: number;
  todayOrders: number;
  todaySupplierPayments: number;
  netCash: number;
  totalProducts: number;
  lowStockProducts: number;
  recentSales: {
    _id: string;
    invoiceNumber: string;
    customer: { name: string; phone: string };
    grandTotal: number;
    paymentMethod: string;
    createdAt: string;
    createdBy: { name: string };
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: "Today's sales",
      value: loading ? "—" : formatCurrency(data?.todaySales ?? 0),
      description: `${data?.todayOrders ?? 0} orders today`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Today's profit",
      value: loading ? "—" : formatCurrency(data?.todayProfit ?? 0),
      description: "Net profit today",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Supplier payments",
      value: loading ? "—" : formatCurrency(data?.todaySupplierPayments ?? 0),
      description: "Paid to suppliers today",
      icon: Wallet,
      color: "text-orange-600",
    },
    {
      title: "Net cash today",
      value: loading ? "—" : formatCurrency(data?.netCash ?? 0),
      description: "Sales minus supplier payments",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Total products",
      value: loading ? "—" : String(data?.totalProducts ?? 0),
      description: "Products in inventory",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Low stock alerts",
      value: loading ? "—" : String(data?.lowStockProducts ?? 0),
      description: "Products with ≤5 units",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6" aria-label="dashboard page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of your shop performance today</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} aria-label={`${stat.title} stat card`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card aria-label="recent sales table">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent sales</CardTitle>
            <CardDescription>Last 5 transactions</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild aria-label="view all bills button">
            <Link href="/bills">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Loading...
            </div>
          ) : !data?.recentSales?.length ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <ShoppingCart className="h-8 w-8 opacity-40" />
              <p>No sales yet today</p>
              <Button size="sm" asChild aria-label="create first sale button">
                <Link href="/pos">Create first sale</Link>
              </Button>
            </div>
          ) : (
            <Table aria-label="recent sales list">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell className="font-mono text-xs">{sale.invoiceNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{sale.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{sale.customer.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentMethod === "cash" ? "secondary" : "default"} className="capitalize">
                        {sale.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(sale.grandTotal)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(sale.createdAt), { addSuffix: true })}
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
    </div>
  );
}
