import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Supplier from "@/models/Supplier";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  const safe = escapeRegex(search);
  const query = safe
    ? {
        $or: [
          { name: { $regex: safe, $options: "i" } },
          { company: { $regex: safe, $options: "i" } },
          { phone: { $regex: safe, $options: "i" } },
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
