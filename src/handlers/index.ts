import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import slug from 'slug';
import formidable from 'formidable';
import { v4 as uuid } from 'uuid';

import User from "../models/User";
import Product from "../models/Product";
import { checkPassword, hashPassword } from '../utils/auth';
import { generateJWT } from '../utils/jwt';
import cloudinary from '../config/cloudinary';
import Device from "../models/Device";
import Pagina from "../models/Pagina";
import DeviceHistory from "../models/DeviceHistory";
import client from "../mqtt/mqttClient";

export const createAccount = async (req: Request, res: Response): Promise<void> => {
  const { email, password, username, nombre, telefono, direccion, preguntaSecreta, respuestaSecreta, rol } = req.body;

  // Verifica que no exista un usuario con el mismo email
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(409).json({ error: 'Un usuario con ese mail ya está registrado' });
    return;
  }

  // Normaliza y verifica disponibilidad del username
  const normalizedUsername = slug(String(username), { replacement: '' });
  const usernameExists = await User.findOne({ username: normalizedUsername });
  if (usernameExists) {
    res.status(409).json({ error: 'Nombre de usuario no disponible' });
    return;
  }

  // Crea el nuevo usuario
  const user = new User({
    username: normalizedUsername,
    nombre,
    email,
    telefono,
    direccion,
    password: await hashPassword(String(password)),
    preguntaSecreta,
    respuestaSecreta,
    rol
  });

  await user.save();
  res.status(201).send('Registro creado correctamente');
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  // Revisar si el usuario está registrado
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ error: 'El Usuario no existe' });
    return;
  }

  // Comprobar el password
  const isPasswordCorrect = await checkPassword(password, user.password);
  if (!isPasswordCorrect) {
    res.status(401).json({ error: 'Password Incorrecto' });
    return;
  }

  // Generar el token con el rol incluido
  const token = generateJWT({ id: user._id, role: user.rol });

  // Devolvemos token y rol en la misma respuesta
  res.status(200).json({ message: 'Login successful', token, role: user.rol });
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  res.json(req.user);
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }
    const { username, nombre, telefono, direccion, preguntaSecreta, respuestaSecreta } = req.body;

    if (username) {
      const normalizedUsername = slug(String(username), { replacement: '' });
      const usernameExists = await User.findOne({ username: normalizedUsername });
      if (usernameExists && usernameExists.email !== req.user.email) {
        res.status(409).json({ error: 'Nombre de usuario no disponible' });
        return;
      }
      req.user.username = normalizedUsername;
    }

    if (nombre) req.user.nombre = nombre;
    if (telefono) req.user.telefono = telefono;
    if (direccion) req.user.direccion = direccion;
    if (preguntaSecreta) req.user.preguntaSecreta = preguntaSecreta;
    if (respuestaSecreta) req.user.respuestaSecreta = respuestaSecreta;

    await req.user.save();
    res.send('Perfil actualizado correctamente');
  } catch (e) {
    res.status(500).json({ error: 'Hubo un error al actualizar el perfil' });
  }
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  const form = formidable({ multiples: false });
  try {
    form.parse(req, (error, fields, files) => {
      if (error) {
        res.status(500).json({ error: 'Error al procesar el formulario' });
        return;
      }
      // Verifica la estructura del archivo
      const filePath = Array.isArray(files.file) ? files.file[0].filepath : files.file.filepath;

      cloudinary.uploader.upload(filePath, { public_id: uuid() }, (error, result) => {
        if (error) {
          res.status(500).json({ error: 'Hubo un error al subir la imagen' });
          return;
        }
        if (result) {
          res.json({ image: result.secure_url });
        }
      });
    });
  } catch (e) {
    res.status(500).json({ error: 'Hubo un error al subir la imagen' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawName = req.body.name;
    let slugName = slug(rawName, '');

    // Verifica si existe y, en caso afirmativo, añade un sufijo único
    let existingProduct = await Product.findOne({ name: slugName });
    if (existingProduct) {
      slugName = `${slugName}-${Date.now()}`;
      // También podrías omitir la verificación si prefieres permitir duplicados
    }

    const product = new Product({
      name: slugName,
      description: req.body.description,
      category: req.body.category,
      image: req.body.image || '',
      brand: req.body.brand || '',
      price: req.body.price || 0,
      stock: req.body.stock || 0,
    });

    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      slug: product.name, 
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno al crear el producto' });
  }
};



export const getUsers = async (req: Request, res: Response) => {
  const users = await User.find().select('username email rol');

  res.json(users);
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rol } = req.body;
  await User.findByIdAndUpdate(id, { rol });
  res.json({ message: 'Rol actualizado' });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id);
  res.json({ message: 'Usuario eliminado' });
};

export const uploadImageP = async (req: Request, res: Response): Promise<void> => {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      // 1) Error al parsear
      if (err) {
        console.error("Error al parsear form:", err);
        res.status(500).json({ error: 'Error al procesar el formulario' });
        return;
      }

      // 2) Verifica si llegó "file"
      if (!files.file) {
        res.status(400).json({ error: "No se envió ningún archivo en 'file'" });
        return;
      }
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = file.filepath;

      // 3) Obtener el name (slug) desde fields
      if (!fields.name) {
        res.status(400).json({ error: "El campo 'name' es obligatorio" });
        return;
      }
      const productName = Array.isArray(fields.name) ? fields.name[0] : fields.name;  
      // productName debe ser "MiProducto", no "Mi Producto"

      // 4) Subir a Cloudinary
      cloudinary.uploader.upload(filePath, { public_id: uuid() }, async (uploadErr, result) => {
        if (uploadErr) {
          console.error("Error subiendo a Cloudinary:", uploadErr);
          res.status(500).json({ error: 'Hubo un error al subir la imagen' });
          return;
        }
        if (!result) {
          res.status(500).json({ error: 'No se recibió resultado de Cloudinary' });
          return;
        }

        // 5) Buscar el producto
        const product = await Product.findOne({ name: productName });
        if (!product) {
          res.status(404).json({ error: `Producto '${productName}' no encontrado` });
          return;
        }

        // 6) Guardar la URL
        product.image = result.secure_url;
        await product.save();

        res.status(201).json({
          message: 'Imagen subida correctamente',
          imageUrl: product.image
        });
      });
    });
  } catch (e) {
    console.error('Error general en uploadImageP:', e);
    res.status(500).json({ error: 'Error interno al subir la imagen' });
  }
};


export async function getProducts(req: Request, res: Response) {
  try {
    const products = await Product.find(); 
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
}

export async function getProductByName(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name } = req.params;
    
    // 1) Si guardas el "name" exactamente como el usuario lo escribió,
    //    basta con:
    const product = await Product.findOne({ name }).lean();
    // lean() para obtener un plain object en vez de un documento Mongoose

    // 2) Si estás usando "slug" al guardar (por ejemplo: "Laptop HP" -> "LaptopHP"),
    //    entonces debes transformar "name" con slug antes de buscar:
    // const productName = slug(name, '');
    // const product = await Product.findOne({ name: productName }).lean();

    if (!product) {
       res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

export const getMyDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("User id en req.user:", req.user?._id);
    const userId = req.user?._id;
    const device = await Device.findOne({ user: userId });
    console.log("Device encontrado:", device);
    if (!device) {
      res.status(200).json({ device: null });
      return;
    }
    res.json(device);
  } catch (error) {
    console.error('Error obteniendo dispositivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const devices = await Device.find().sort({ updatedAt: -1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los dispositivos" });
  }
};

/**
 * Obtener el historial de un dispositivo (por deviceId).
 */
export const getDeviceHistory = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    // Buscar el dispositivo en la colección Device
    const device = await Device.findOne({ deviceId });
    if (!device) {
      res.status(404).json({ error: "Dispositivo no encontrado" });
      return 
    }
    // Buscar el historial
    const history = await DeviceHistory.find({ device: device._id })
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el historial" });
  }
};

/**
 * Enviar comando al ESP32 via MQTT.
 */
export const sendCommandToDevice = (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const { command } = req.body;

  if (!command) {
    res.status(400).json({ error: "Falta el comando en el body" });
    return
  }

  let topic = "";
  let payload = command;

  if (command === "abrir" || command === "cerrar") {
    topic = "esp32/ventana/control";
  } else if (command === "activarSeguro") {
    topic = "esp32/seguro/control";
    payload = "activar";
  } else if (command === "desactivarSeguro") {
    topic = "esp32/seguro/control";
    payload = "desactivar";
  } else if (command === "activarAlarma") {
    topic = "esp32/alarma/control";
    payload = "activar";
  } else if (command === "desactivarAlarma") {
    topic = "esp32/alarma/control";
    payload = "desactivar";
  } else if (command === "manual" || command === "automatico") {
    topic = "esp32/modo/control";
  } else {
    res.status(400).json({ error: `Comando '${command}' no reconocido` });
    return
  }

  // Publicamos
  client.publish(topic, payload, (err) => {
    if (err) {
      console.error("Error publicando en MQTT:", err);
      res.status(500).json({ error: "Error al publicar el comando en MQTT" });
      return
    }
    console.log(`[MQTT] Se publicó: topic='${topic}', payload='${payload}'`);
    res.json({ success: true, message: `Comando '${command}' enviado a '${deviceId}'` });
  });
};

export const registerDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { deviceId } = req.body;
    const userId = req.user._id;

    if (!deviceId) {
      res.status(400).json({ error: 'El deviceId es obligatorio' });
      return;
    }

    // Verifica si ya existe un dispositivo con ese deviceId
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      res.status(409).json({ error: 'Este deviceId ya está registrado' });
      return;
    }

    // Crea el nuevo dispositivo y asócialo al usuario
    const newDevice = await Device.create({
      deviceId,
      user: userId
    });

    res.status(201).json({
      message: 'Dispositivo registrado correctamente',
      device: newDevice
    });
  } catch (error) {
    console.error('Error al registrar dispositivo:', error);
    res.status(500).json({ error: 'Error interno al registrar el dispositivo' });
  }
};


export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // ID del producto
    const fieldsToUpdate = { ...req.body };

    // Si actualizas el name, podrías volver a slugificar:
    if (fieldsToUpdate.name) {
      // Ejemplo, si sigues usando slug
      fieldsToUpdate.name = slug(fieldsToUpdate.name, '');
    }

    const updated = await Product.findByIdAndUpdate(id, fieldsToUpdate, {
      new: true, // retorna el doc actualizado
    });

    if (!updated) {
      res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto actualizado correctamente',
      product: updated,
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno al actualizar producto' });
  }
};
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno al eliminar producto' });
  }
};


// Handler protegido: obtener página (para administración)
export const getPagina = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paginaName } = req.params;
    const pagina = await Pagina.findOne({ paginaName });
    if (!pagina) {
      res.status(404).json({ error: "Página no encontrada" });
      return;
    }
    res.json(pagina);
  } catch (error) {
    res.status(500).json({ error: "Error interno al obtener la página" });
  }
};

// Handler público: obtener página sin autenticación (para el frontend público)
export const getPaginaPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paginaName } = req.params;
    const pagina = await Pagina.findOne({ paginaName });
    if (!pagina) {
      res.status(404).json({ error: "Página no encontrada" });
      return;
    }
    res.json(pagina);
  } catch (error) {
    res.status(500).json({ error: "Error interno al obtener la página" });
  }
};

// Handler para actualizar la página
export const updatePagina = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paginaName } = req.params;
    const fieldsToUpdate = { ...req.body };

    const updated = await Pagina.findOneAndUpdate(
      { paginaName },
      fieldsToUpdate,
      { new: true, upsert: false } // no crea si no existe
    );

    if (!updated) {
      res.status(404).json({ error: "Página no encontrada" });
      return;
    }
    res.json({ message: "Página actualizada correctamente", data: updated });
  } catch (error) {
    res.status(500).json({ error: "Error interno al actualizar la página" });
  }
};