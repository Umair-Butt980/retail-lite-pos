import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Product from "@/models/Product";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const product = await Product.findById(id).lean();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ message: "Product deleted" });
}
