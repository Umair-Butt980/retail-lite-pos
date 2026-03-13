import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import ExternalWork from "@/models/ExternalWork";

async function resolveRecord(id: string, userId: string, isAdmin: boolean) {
  const work = await ExternalWork.findById(id).lean() as { createdBy?: unknown } | null;
  if (!work) return { error: "Not found", status: 404 };
  // Allow admins to edit anything; employees can only edit their own records
  if (!isAdmin && String(work.createdBy) !== userId) {
    return { error: "Forbidden", status: 403 };
  }
  return { work };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const check = await resolveRecord(id, session.user.id, session.user.role === "admin");
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json();

  // Destructure only allowed fields — prevents mass assignment of profit, createdBy, etc.
  const { title, description, customerName, customerPhone, labourCost, chargedPrice, paymentMethod, status } = body;
  const allowedUpdate: Record<string, unknown> = {
    title, description, customerName, customerPhone, paymentMethod, status,
  };
  if (labourCost != null) allowedUpdate.labourCost = Number(labourCost);
  if (chargedPrice != null) allowedUpdate.chargedPrice = Number(chargedPrice);
  if (labourCost != null && chargedPrice != null) {
    allowedUpdate.profit = Number(chargedPrice) - Number(labourCost);
  }

  const work = await ExternalWork.findByIdAndUpdate(id, allowedUpdate, { new: true, runValidators: true }).lean();
  return NextResponse.json(work);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const check = await resolveRecord(id, session.user.id, session.user.role === "admin");
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

  await ExternalWork.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
