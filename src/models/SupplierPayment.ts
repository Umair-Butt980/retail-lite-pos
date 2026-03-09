import mongoose, { Document, Schema } from "mongoose";

export interface ISupplierPayment extends Document {
  supplier: mongoose.Types.ObjectId;
  supplierName: string;
  supplierCompany: string;
  amount: number;
  notes?: string;
  paidBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierPaymentSchema = new Schema<ISupplierPayment>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true },
    supplierCompany: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    notes: { type: String, default: "" },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SupplierPaymentSchema.index({ createdAt: -1 });
SupplierPaymentSchema.index({ supplier: 1 });

export default mongoose.models.SupplierPayment ||
  mongoose.model<ISupplierPayment>("SupplierPayment", SupplierPaymentSchema);
