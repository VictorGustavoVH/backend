// models/Pagina.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IPagina extends Document {
  paginaName: string;          
  quienesSomos: string;        
  preguntasFrecuentes: string; 
  mision: string;
  vision: string;
  valores: string;
  contacto: string;     // Agregado
  terminos: string;     // Agregado
  updatedAt?: Date;
  createdAt?: Date;
}

const PaginaSchema = new Schema<IPagina>(
  {
    paginaName: { type: String, required: true, unique: true },
    quienesSomos: { type: String, default: "" },
    preguntasFrecuentes: { type: String, default: "" },
    mision: { type: String, default: "" },
    vision: { type: String, default: "" },
    valores: { type: String, default: "" },
    contacto: { type: String, default: "" },  // Agregado
    terminos: { type: String, default: "" },   // Agregado
  },
  { timestamps: true }
);

export default mongoose.model<IPagina>("Pagina", PaginaSchema);
