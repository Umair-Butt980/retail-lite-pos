import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const safe = escapeRegex(q);
  const products = await Product.find({
    $or: [
      { name: { $regex: safe, $options: "i" } },
      { sku: { $regex: safe, $options: "i" } },
    ],
    stock: { $gt: 0 },
  })
    .limit(10)
    .lean();

  return NextResponse.json(products);
}
