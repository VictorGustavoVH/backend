// models/Product.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  image: string;
  brand?: string;
  price?: number;
  stock?: number;
  createdAt?: Date;   // timestamps
  updatedAt?: Date;   // timestamps
}

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // si quieres que no se repita
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    // Campos nuevos
    brand: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
