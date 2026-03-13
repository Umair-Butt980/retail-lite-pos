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
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";

  const safe = escapeRegex(search);
  const query = safe
    ? { $or: [{ name: { $regex: safe, $options: "i" } }, { sku: { $regex: safe, $options: "i" } }] }
    : {};

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const body = await req.json();
  const { sku, name, description, category, basePrice, sellingPrice, stock, image } = body;

  if (!sku || !name || !category || basePrice == null || sellingPrice == null || stock == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await Product.findOne({ sku: sku.toUpperCase() });
  if (existing) {
    return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
  }

  const product = await Product.create({ sku, name, description, category, basePrice, sellingPrice, stock, image });

  return NextResponse.json(product, { status: 201 });
}
