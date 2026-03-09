import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import SupplierPayment from "@/models/SupplierPayment";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todaySales, totalProducts, lowStockProducts, recentSales, todaySupplierPayments] =
    await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$grandTotal" },
            totalProfit: { $sum: "$totalProfit" },
            count: { $sum: 1 },
          },
        },
      ]),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
      Sale.find().sort({ createdAt: -1 }).limit(5).populate("createdBy", "name").lean(),
      SupplierPayment.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

  const grossSales = todaySales[0]?.totalSales ?? 0;
  const supplierPaidToday = todaySupplierPayments[0]?.total ?? 0;

  return NextResponse.json({
    todaySales: grossSales,
    todayProfit: todaySales[0]?.totalProfit ?? 0,
    todayOrders: todaySales[0]?.count ?? 0,
    todaySupplierPayments: supplierPaidToday,
    todaySupplierPaymentCount: todaySupplierPayments[0]?.count ?? 0,
    netCash: grossSales - supplierPaidToday,
    totalProducts,
    lowStockProducts,
    recentSales,
  });
}
