import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Supplier from "@/models/Supplier";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const suppliers = await Supplier.find(query).sort({ createdAt: -1 }).lean();

  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const body = await req.json();
  const { name, company, phone, email, notes, totalCredit } = body;

  if (!name || !company || !phone || totalCredit == null) {
    return NextResponse.json({ error: "Name, company, phone, and credit amount are required" }, { status: 400 });
  }

  const supplier = await Supplier.create({
    name,
    company,
    phone,
    email: email ?? "",
    notes: notes ?? "",
    totalCredit: Number(totalCredit),
    totalPaid: 0,
    balance: Number(totalCredit),
  });

  return NextResponse.json(supplier, { status: 201 });
}
