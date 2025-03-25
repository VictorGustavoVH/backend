// models/Pagina.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IPagina extends Document {
  paginaName: string;          // Por ejemplo: "quienes-somos" o "preguntas-frecuentes"
  quienesSomos: string;        // Texto de la sección "Quiénes Somos"
  preguntasFrecuentes: string; // Texto o JSON con las FAQs
  mision: string;
  vision: string;
  valores: string;
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
  },
  { timestamps: true }
);

export default mongoose.model<IPagina>("Pagina", PaginaSchema);
