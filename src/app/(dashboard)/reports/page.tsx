"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingUp, DollarSign, ShoppingCart, BarChart3, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";

interface ChartPoint {
  label: string;
  sales: number;
  profit: number;
  orders: number;
}

interface Summary {
  totalSales: number;
  totalProfit: number;
  orderCount: number;
  avgOrderValue: number;
  totalSupplierPayments: number;
  netCash: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setChart(data.chart ?? []);
        setSummary(data.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const periodLabel = {
    daily: "Last 30 days",
    monthly: "Last 12 months",
    yearly: "Last 5 years",
  }[period];

  const statsCards = summary
    ? [
        {
          title: "Total sales",
          value: formatCurrency(summary.totalSales),
          icon: DollarSign,
          color: "text-green-600",
          description: periodLabel,
        },
        {
          title: "Total profit",
          value: formatCurrency(summary.totalProfit),
          icon: TrendingUp,
          color: "text-blue-600",
          description: periodLabel,
        },
        {
          title: "Supplier payments",
          value: formatCurrency(summary.totalSupplierPayments ?? 0),
          icon: Wallet,
          color: "text-orange-600",
          description: "Paid to suppliers",
        },
        {
          title: "Net cash",
          value: formatCurrency(summary.netCash ?? 0),
          icon: BarChart3,
          color: "text-purple-600",
          description: "Sales minus supplier payments",
        },
        {
          title: "Total orders",
          value: String(summary.orderCount),
          icon: ShoppingCart,
          color: "text-slate-600",
          description: periodLabel,
        },
        {
          title: "Avg. order value",
          value: formatCurrency(summary.avgOrderValue),
          icon: BarChart3,
          color: "text-indigo-600",
          description: "Per transaction",
        },
      ]
    : [];

  const tooltipFormatter = (value: unknown) =>
    typeof value === "number" ? formatCurrency(value) : String(value);

  return (
    <div className="space-y-6" aria-label="reports page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground text-sm">Sales and profit analytics</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList aria-label="period filter tabs">
            <TabsTrigger value="daily" aria-label="daily filter tab">Daily</TabsTrigger>
            <TabsTrigger value="monthly" aria-label="monthly filter tab">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" aria-label="yearly filter tab">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reports...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} aria-label={`${stat.title} report card`}>
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

          {/* Sales Chart */}
          <Card aria-label="sales chart">
            <CardHeader>
              <CardTitle>Sales overview</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {chart.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Bar dataKey="sales" fill="#171717" name="Sales" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="profit" fill="#2a9d90" name="Profit" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="supplierPayments" fill="#f97316" name="Supplier payments" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Profit Trend Line Chart */}
          <Card aria-label="profit trend chart">
            <CardHeader>
              <CardTitle>Profit trend</CardTitle>
              <CardDescription>Net profit over time — {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {chart.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={tooltipFormatter} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#171717" strokeWidth={2} dot={false} name="Sales" />
                    <Line type="monotone" dataKey="profit" stroke="#2a9d90" strokeWidth={2} dot={false} name="Profit" />
                    <Line type="monotone" dataKey="supplierPayments" stroke="#f97316" strokeWidth={2} dot={false} name="Supplier payments" strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="netCash" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Net cash" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Orders per period */}
          <Card aria-label="orders per period chart">
            <CardHeader>
              <CardTitle>Orders per period</CardTitle>
              <CardDescription>Number of transactions — {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {chart.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chart} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#e76e50" name="Orders" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
