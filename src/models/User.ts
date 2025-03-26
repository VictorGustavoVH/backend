import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  password: string;
  preguntaSecreta: string;
  respuestaSecreta: string;
  rol: 'usuario' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  expoPushToken: string | null;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'El teléfono debe contener exactamente 10 dígitos numéricos']
  },
  direccion: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  preguntaSecreta: {
    type: String,
    required: true
  },
  respuestaSecreta: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['usuario', 'admin'],
    default: 'usuario'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expoPushToken: {
    type: String,
    default: null,
  }
});

// Middleware para actualizar 'updatedAt' en cada guardado
userSchema.pre<IUser>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
