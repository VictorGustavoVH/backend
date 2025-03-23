// models/Product.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IPAGINA extends Document {
  Pagina: string;
  QuienesSomos: string;
  PreguntasF: string;
  Respuesta: string;
  Mision: string;
  Vision: string;
  Valores: string;
  
  createdAt?: Date;   // timestamps
  updatedAt?: Date;   // timestamps
}

const productSchema = new Schema(
  {
    Pagina: {
      type: String,
      required: true,
      unique: true, // si quieres que no se repita
    },
    QuienesSomos: {
      type: String,
      required: true,
    },
    PreguntasF: {
      type: String,
      required: true,
    },
    Respuesta: {
        type: String,
        required: true,
        unique: true, // si quieres que no se repita
      },
    Mision: {
        type: String,
        required: true,
    },
    Vision: {
        type: String,
        required: true,
    },
    Valores: {
        type: String,
        required: true,
    }
    
  },
  { timestamps: true }
);

const Product = mongoose.model<IPAGINA>("Product", productSchema);
export default Product;
