import mongoose, { Document, Schema } from "mongoose";

export interface ISupplier extends Document {
  name: string;
  company: string;
  phone: string;
  email?: string;
  notes?: string;
  totalCredit: number;
  totalPaid: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "" },
    notes: { type: String, default: "" },
    totalCredit: { type: Number, required: true, default: 0, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate balance before save
SupplierSchema.pre("save", function (next) {
  this.balance = this.totalCredit - this.totalPaid;
  next();
});

export default mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);
