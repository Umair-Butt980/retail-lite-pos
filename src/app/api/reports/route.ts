import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import SupplierPayment from "@/models/SupplierPayment";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "daily";

  const now = new Date();
  let startDate: Date;
  let groupFormat: Record<string, unknown>;
  let labelField: string;

  if (period === "daily") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    groupFormat = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
      day: { $dayOfMonth: "$createdAt" },
    };
    labelField = "day";
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    groupFormat = {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" },
    };
    labelField = "month";
  } else {
    startDate = new Date(now.getFullYear() - 4, 0, 1);
    groupFormat = {
      year: { $year: "$createdAt" },
    };
    labelField = "year";
  }

  const [chartData, supplierChartData, summary, supplierSummary] = await Promise.all([
    Sale.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$totalProfit" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),
    SupplierPayment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: groupFormat,
          totalPaid: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),
    Sale.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalProfit: { $sum: "$totalProfit" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$grandTotal" },
        },
      },
    ]),
    SupplierPayment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalPaid: { $sum: "$amount" }, paymentCount: { $sum: 1 } } },
    ]),
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Build a lookup map for supplier payments by label
  const supplierMap = new Map<string, number>();
  for (const d of supplierChartData) {
    let key = "";
    if (period === "daily") key = `${d._id.day}/${d._id.month}`;
    else if (period === "monthly") key = months[d._id.month - 1];
    else key = String(d._id.year);
    supplierMap.set(key, Math.round(d.totalPaid));
  }

  const formattedChart = chartData.map((d) => {
    let label = "";
    if (period === "daily") label = `${d._id.day}/${d._id.month}`;
    else if (period === "monthly") label = months[d._id.month - 1];
    else label = String(d._id.year);

    const supplierPaid = supplierMap.get(label) ?? 0;
    return {
      label,
      sales: Math.round(d.totalSales),
      profit: Math.round(d.totalProfit),
      orders: d.orderCount,
      supplierPayments: supplierPaid,
      netCash: Math.round(d.totalSales) - supplierPaid,
    };
  });

  const totalSupplierPaid = supplierSummary[0]?.totalPaid ?? 0;
  const grossSales = summary[0]?.totalSales ?? 0;

  return NextResponse.json({
    chart: formattedChart,
    summary: {
      ...(summary[0] ?? { totalSales: 0, totalProfit: 0, orderCount: 0, avgOrderValue: 0 }),
      totalSupplierPayments: totalSupplierPaid,
      netCash: grossSales - totalSupplierPaid,
    },
    labelField,
  });
}
