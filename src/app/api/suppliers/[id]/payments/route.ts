import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Supplier from "@/models/Supplier";
import SupplierPayment from "@/models/SupplierPayment";
import mongoose from "mongoose";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { amount, notes } = body;

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Payment amount must be greater than zero" }, { status: 400 });
  }

  const supplier = await Supplier.findById(id);
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  if (Number(amount) > supplier.balance) {
    return NextResponse.json(
      { error: `Payment (Rs.${amount}) exceeds remaining balance (Rs.${supplier.balance})` },
      { status: 400 }
    );
  }

  // Record the payment
  const payment = await SupplierPayment.create({
    supplier: supplier._id,
    supplierName: supplier.name,
    supplierCompany: supplier.company,
    amount: Number(amount),
    notes: notes ?? "",
    paidBy: new mongoose.Types.ObjectId(session.user.id),
  });

  // Update supplier totals
  supplier.totalPaid += Number(amount);
  supplier.balance = supplier.totalCredit - supplier.totalPaid;
  await supplier.save();

  return NextResponse.json({ payment, supplier }, { status: 201 });
}
