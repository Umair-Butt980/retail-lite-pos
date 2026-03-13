import mongoose, { Document, Schema } from "mongoose";

export interface IExternalWork extends Document {
  title: string;
  description?: string;
  customerName: string;
  customerPhone: string;
  labourCost: number;
  chargedPrice: number;
  profit: number;
  paymentMethod: "cash" | "online" | "pending";
  status: "completed" | "pending";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExternalWorkSchema = new Schema<IExternalWork>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    labourCost: { type: Number, required: true, min: 0 },
    chargedPrice: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "online", "pending"], default: "cash" },
    status: { type: String, enum: ["completed", "pending"], default: "completed" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ExternalWorkSchema.index({ createdAt: -1 });

export default mongoose.models.ExternalWork ||
  mongoose.model<IExternalWork>("ExternalWork", ExternalWorkSchema);
