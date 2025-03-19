import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;      // Identificador único del dispositivo (por ejemplo, "ventana1")
  user: mongoose.Types.ObjectId; // Referencia al usuario que registró el dispositivo
  ventana: string;       // Estado de la ventana ("abierto" o "cerrado")
  modo: string;          // Modo de operación ("Manual", "Automático", etc.)
  lluvia: string;        // "SI" o "NO"
  seguro: string;        // "activo" o "desactivo"
  diaNoche: string;      // "Día" o "Noche"
  alarma: string;        // "ACTIVADA" o "DESACTIVADA"
  temperatura: number;   // Ejemplo: 26.7
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ventana: { type: String, default: 'cerrado' },
    modo: { type: String, default: 'Manual' },
    lluvia: { type: String, default: 'NO' },
    seguro: { type: String, default: 'desactivo' },
    diaNoche: { type: String, default: 'Noche' },
    alarma: { type: String, default: 'DESACTIVADA' },
    temperatura: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IDevice>('Device', DeviceSchema);
