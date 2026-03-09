import mongoose, { Document, Schema } from "mongoose";

export interface ISaleItem {
  product: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  amount: number;
  profit: number;
}

export interface ISale extends Document {
  invoiceNumber: string;
  customer: {
    name: string;
    phone: string;
  };
  items: ISaleItem[];
  paymentMethod: "cash" | "online";
  subTotal: number;
  discount: number;
  grandTotal: number;
  totalProfit: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    amount: { type: Number, required: true },
    profit: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [SaleItemSchema],
    paymentMethod: { type: String, enum: ["cash", "online"], required: true },
    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    totalProfit: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

SaleSchema.index({ createdAt: -1 });

export default mongoose.models.Sale || mongoose.model<ISale>("Sale", SaleSchema);
