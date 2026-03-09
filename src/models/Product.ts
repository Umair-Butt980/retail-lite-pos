import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  sellingPrice: number;
  stock: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", sku: "text" });

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
