  // src/models/DeviceHistory.ts
  import { Schema, model, Document, Types } from "mongoose";

  export interface IDeviceHistory extends Document {
    device: Types.ObjectId; // referencia al _id del documento Device
    action: string;         // p.ej. "abrir", "cerrar", "activarSeguro", ...
    details?: string;       // información adicional
    createdAt: Date;
  }

  const DeviceHistorySchema = new Schema<IDeviceHistory>(
    {
      device: { type: Schema.Types.ObjectId, ref: "Device", required: true },
      action: { type: String, required: true },
      details: { type: String }
    },
    {
      timestamps: { createdAt: true, updatedAt: false }
    }
  );

  export default model<IDeviceHistory>("DeviceHistory", DeviceHistorySchema);
