import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Sale from "@/models/Sale";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const sale = await Sale.findById(id).populate("createdBy", "name email").lean();
  if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

  return NextResponse.json(sale);
}
