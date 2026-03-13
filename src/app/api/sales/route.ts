import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import mongoose from "mongoose";
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
    ? {
        $or: [
          { invoiceNumber: { $regex: safe, $options: "i" } },
          { "customer.name": { $regex: safe, $options: "i" } },
          { "customer.phone": { $regex: safe, $options: "i" } },
        ],
      }
    : {};

  const [sales, total] = await Promise.all([
    Sale.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    Sale.countDocuments(query),
  ]);

  return NextResponse.json({ sales, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json();
  const { customer, items, paymentMethod, discount = 0 } = body;

  if (!customer?.name || !customer?.phone) {
    return NextResponse.json({ error: "Customer name and phone are required" }, { status: 400 });
  }
  if (!items?.length) {
    return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
  }
  if (!paymentMethod) {
    return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
  }

  // Verify stock availability for all items first
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.name} not found` }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
        { status: 400 }
      );
    }
  }

  // Fetch product details to calculate prices
  const saleItems = [];
  let subTotal = 0;
  let totalProfit = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;

    const amount = product.sellingPrice * item.quantity;
    const profit = (product.sellingPrice - product.basePrice) * item.quantity;

    saleItems.push({
      product: product._id,
      sku: product.sku,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      basePrice: product.basePrice,
      amount,
      profit,
    });

    subTotal += amount;
    totalProfit += profit;
  }

  const grandTotal = subTotal - discount;
  const saleCount = await Sale.countDocuments();
  const invoiceNumber = `INV-${String(saleCount + 1).padStart(4, "0")}`;

  try {
    const sale = await Sale.create({
      invoiceNumber,
      customer,
      items: saleItems,
      paymentMethod,
      subTotal,
      discount,
      grandTotal,
      totalProfit,
      createdBy: new mongoose.Types.ObjectId(session.user.id),
    });

    // Deduct stock for each item after sale is created
    for (const item of saleItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (err) {
    console.error("Sale creation error:", err);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
