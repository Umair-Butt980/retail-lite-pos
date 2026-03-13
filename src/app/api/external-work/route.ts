import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import ExternalWork from "@/models/ExternalWork";
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
          { title: { $regex: safe, $options: "i" } },
          { customerName: { $regex: safe, $options: "i" } },
          { customerPhone: { $regex: safe, $options: "i" } },
        ],
      }
    : {};

  const [works, total] = await Promise.all([
    ExternalWork.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    ExternalWork.countDocuments(query),
  ]);

  return NextResponse.json({ works, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const body = await req.json();
  const { title, description, customerName, customerPhone, labourCost, chargedPrice, paymentMethod, status } = body;

  if (!title || !customerName || !customerPhone || labourCost == null || chargedPrice == null) {
    return NextResponse.json({ error: "Title, customer details, labour cost, and charged price are required" }, { status: 400 });
  }

  const profit = Number(chargedPrice) - Number(labourCost);

  const work = await ExternalWork.create({
    title,
    description: description ?? "",
    customerName,
    customerPhone,
    labourCost: Number(labourCost),
    chargedPrice: Number(chargedPrice),
    profit,
    paymentMethod: paymentMethod ?? "cash",
    status: status ?? "completed",
    createdBy: new mongoose.Types.ObjectId(session.user.id),
  });

  return NextResponse.json(work, { status: 201 });
}
