import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Supplier from "@/models/Supplier";
import SupplierPayment from "@/models/SupplierPayment";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  const [supplier, payments] = await Promise.all([
    Supplier.findById(id).lean(),
    SupplierPayment.find({ supplier: id })
      .sort({ createdAt: -1 })
      .populate("paidBy", "name")
      .lean(),
  ]);

  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  return NextResponse.json({ supplier, payments });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const supplier = await Supplier.findById(id);
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  Object.assign(supplier, body);
  // Recalculate balance
  supplier.balance = supplier.totalCredit - supplier.totalPaid;
  await supplier.save();

  return NextResponse.json(supplier);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  await Promise.all([
    Supplier.findByIdAndDelete(id),
    SupplierPayment.deleteMany({ supplier: id }),
  ]);

  return NextResponse.json({ message: "Supplier deleted" });
}
