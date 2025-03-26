// server.ts

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import router from './router';
import { connectDB } from './config/db';
import { corsConfig } from './config/cors';
import http from 'http';
import { Server } from 'socket.io';
import { sendPushNotification } from './utils/sendPushNotification';
import client from './mqtt/mqttClient';  // <-- Cliente MQTT
import Device from './models/Device';
import DeviceHistory from './models/DeviceHistory';
import { IDevice } from './models/Device';
import User from './models/User';

// Conecta la base de datos
connectDB();

const app = express();

// Configuración de CORS
app.use(cors(corsConfig));

// Lectura de datos de formularios en formato JSON
app.use(express.json());

// Rutas de tu API (importadas desde 'router.ts')
app.use('/', router);

// Creación de servidor HTTP a partir de 'app'
const server = http.createServer(app);

// Configuración de Socket.IO para permitir CORS
const io = new Server(server, {
  cors: { origin: '*' },
});

// Manejo de las conexiones Socket.IO
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Escuchar evento "getDevice" para retornar el dispositivo 'ventana1'
  socket.on('getDevice', async (data, callback) => {
    try {
      const device = await Device.findOne({ deviceId: 'ventana1' });
      callback(device);
    } catch (error) {
      console.error('Error al obtener el dispositivo:', error);
      callback(null);
    }
  });

  // Manejo de desconexiones
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

/**
 * Manejo de mensajes MQTT.
 * Se actualiza el dispositivo y se registra en el historial si cambian
 * los campos: ventana, alarma, seguro y modo.
 * 
 * Lógica adicional para la ventana (cierre/apertura) según día/noche, lluvia,
 * temperatura y modo automático/manual.
 */
client.on('message', async (topic: string, message: Buffer) => {
  const payloadStr = message.toString();
  console.log(`Mensaje MQTT: topic='${topic}', payload='${payloadStr}'`);

  // Se asume un único dispositivo con ID "ventana1"
  const deviceId = 'ventana1';

  // Objeto parcial para actualizar el dispositivo
  const newState: Partial<IDevice> = {};

  try {
    // Determinar el campo a actualizar según el topic
    if (topic === 'esp32/ventana/estado') {
      newState.ventana = payloadStr;
    } else if (topic === 'esp32/modo/estado') {
      newState.modo = payloadStr;
    } else if (topic === 'esp32/seguro/estado') {
      newState.seguro = payloadStr;
    } else if (topic === 'esp32/alarma/estado') {
      newState.alarma = payloadStr;
    } else if (topic === 'esp32/sensores/temperatura') {
      const tempVal = parseFloat(payloadStr);
      if (!isNaN(tempVal)) {
        newState.temperatura = tempVal;
      }
    } else if (topic === 'esp32/sensores/lluvia') {
      newState.lluvia = payloadStr;
    } else if (topic === 'esp32/sensores/diaNoche') {
      newState.diaNoche = payloadStr;
    } else {
      // Si el topic no coincide con ninguno de los anteriores, no hacemos nada
      return;
    }

    // 1) Obtener el estado actual del dispositivo en la BD
    const currentDevice = await Device.findOne({ deviceId });

    // 2) Actualizar (o crear) el dispositivo con newState
    const updatedDevice = await Device.findOneAndUpdate(
      { deviceId },
      { ...newState, deviceId },
      { new: true, upsert: true }
    );

    console.log(`Device '${deviceId}' actualizado:`, updatedDevice);

    // 3) Registrar en el historial si cambian ventana, alarma, seguro o modo
    const properties: Array<keyof IDevice> = ['ventana', 'alarma', 'seguro', 'modo'];

    for (const prop of properties) {
      // Verificamos si este campo cambió realmente
      if (
        newState[prop] !== undefined &&
        currentDevice &&
        currentDevice[prop] !== newState[prop]
      ) {
        let action = '';
        let details = payloadStr; // Valor por defecto

        // Lógica específica para la ventana
        if (prop === 'ventana') {
          const newWindowOpen = newState.ventana!.toLowerCase().includes('abierto');
          const isDay = updatedDevice?.diaNoche?.toLowerCase().includes('dia');
          const isNight = updatedDevice?.diaNoche?.toLowerCase().includes('noche');
          const isRaining = updatedDevice?.lluvia?.toLowerCase() === 'si';
          const temp = updatedDevice?.temperatura;

          // Revisamos si el dispositivo está en modo automático
          if (updatedDevice && updatedDevice.modo.toLowerCase() !== 'manual') {
            if (isNight) {
              action = 'cierre';
              details = 'cierre y activación de seguro';
            } else if (isDay) {
              if (isRaining) {
                action = 'cierre';
                details = 'cierre por lluvia';
              } else if (temp !== undefined && temp < 15) {
                action = 'cierre';
                details = 'cierre por frío';
              } else if (temp !== undefined && temp > 25) {
                // Si hace calor, la ventana debería estar abierta
                if (!newWindowOpen) {
                  action = 'apertura';
                  details = 'apertura por calor';
                } else {
                  action = 'apertura';
                  details = 'apertura';
                }
              } else {
                // Temperatura normal (15-25°C)
                if (newWindowOpen) {
                  action = 'apertura';
                  details = 'apertura por día';
                } else {
                  action = '';
                }
              }
            } else {
              // Si no podemos determinar si es día o noche
              action = newWindowOpen ? 'apertura' : 'cierre';
              details = action;
            }
          } else {
            // Modo manual
            action = newWindowOpen ? 'apertura' : 'cierre';
            details = action;
          }
        } 
        // Lógica para alarma
        else if (prop === 'alarma') {
          action = newState.alarma!.toLowerCase().includes('activada')
            ? 'activarAlarma'
            : 'desactivarAlarma';
        } 
        if (action === 'activarAlarma' && updatedDevice) {
          const userId = updatedDevice.user;
          if (userId) {
            const user = await User.findById(userId);
            if (user && user.expoPushToken) {
              await sendPushNotification(user.expoPushToken, {
                title: 'Alarma Activada',
                body: 'La alarma se ha activado. Por favor, revisa tu dashboard.',
                data: { screen: 'Dashboard' },
              });
            }
          }
        }
        // Lógica para seguro
        else if (prop === 'seguro') {
          action = newState.seguro!.toLowerCase().includes('activo')
            ? 'activarSeguro'
            : 'desactivarSeguro';
        } 
        // Lógica para modo
        else if (prop === 'modo') {
          action = newState.modo!.toLowerCase().includes('manual')
            ? 'manual'
            : 'automatico';
        }

        // Si determinamos una acción válida, se registra en el historial
        if (action && updatedDevice) {
          await DeviceHistory.create({
            device: updatedDevice._id,
            action,
            details,
          });
          console.log(`Historial registrado para ${prop}: ${action} - ${details}`);
        }
      }
    }

    // Emitir el evento de actualización vía Socket.IO
    io.emit('deviceUpdate', updatedDevice);

  } catch (error) {
    console.error('Error procesando mensaje MQTT:', error);
  }
});

// Exportamos el server (con Socket.IO integrado)
export default server;
