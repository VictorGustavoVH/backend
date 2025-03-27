  //router.ts
  import { Router } from 'express';
  import { body } from 'express-validator';

  import {
    createAccount,
    getUser,
    login,
    updateProfile,
    createProduct,
    uploadImage,
    uploadImageP,
    getProducts, 
    getProductByName,
    getAllDevices,
    getDeviceHistory,
    sendCommandToDevice,
    getUsers,
    updateUserRole,
    deleteUser,
    registerDevice,
    getMyDevice,
    deleteProduct,
    updateProduct,
    updatePagina,
    getPagina,
    getPaginaPublic,
    savePushToken
  } from './handlers';
  import { handleInputErrors } from './middleware/validation';
  import { authenticate } from './middleware/auth';

  const router = Router();

  /** Registro de usuario */
  router.post(
    '/register',
    [
      body('username')
        .notEmpty().withMessage('El nombre de usuario no puede estar vacío')
        .isLength({ min: 3, max: 20 }).withMessage('El nombre de usuario debe tener entre 3 y 20 caracteres'),
      body('nombre')
        .notEmpty().withMessage('El nombre no puede estar vacío'),
      body('email')
        .isEmail().withMessage('E-mail no válido'),
      body('telefono')
        .matches(/^\d{10}$/).withMessage('El teléfono debe contener exactamente 10 dígitos numéricos'),
      body('direccion')
        .notEmpty().withMessage('La dirección es obligatoria'),
      body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
      body('preguntaSecreta')
        .notEmpty().withMessage('La pregunta secreta es obligatoria'),
      body('respuestaSecreta')
        .notEmpty().withMessage('La respuesta secreta es obligatoria'),
      // El campo rol es opcional, pero si se envía debe ser "usuario" o "admin"
      body('rol')
        .optional()
        .isIn(['usuario', 'admin']).withMessage('Rol inválido'),
      handleInputErrors
    ],
    createAccount
  );
// Asegúrate de haber importado getProductByName y de registrar la ruta:
router.get('/products/:name', getProductByName);


  router.get('/products', getProducts); 

  /** Login */
  router.post(
    '/login',
    [
      body('email')
        .isEmail().withMessage('E-mail no válido'),
      body('password')
        .notEmpty().withMessage('La contraseña es obligatoria'),
      handleInputErrors
    ],
    login
  );

  /** Obtener usuario autenticado */
  router.get('/user', authenticate, getUser);

  /** Actualizar perfil */
  router.patch(
    '/user',
    [
      authenticate, // Se ejecuta antes de actualizar el perfil
      body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
      body('telefono').optional().matches(/^\d{10}$/).withMessage('El teléfono debe contener exactamente 10 dígitos numéricos'),
      body('direccion').optional().notEmpty().withMessage('La dirección es obligatoria'),
      // Por seguridad, no permitimos actualizar el rol desde este endpoint
      handleInputErrors
    ],
    updateProfile
  );

  router.post('/admin/product/GestionProductos/Register', 
    body('name')
      .notEmpty()
      .withMessage('El nombre no puede estar vacio'),
    body('description')
      .notEmpty()
      .withMessage('La descripcion no puede estar vacia'),
    body('category')
      .notEmpty()
      .withMessage('La categoria no puede estar vacia'),
      body('brand')
      .optional()
      .isString()
      .withMessage('La marca debe ser un texto'),
    body('price')
      .optional()
      .isNumeric()
      .withMessage('El precio debe ser un número'),
    body('stock')
      .optional()
      .isNumeric()
      .withMessage('El stock debe ser un número'),
      authenticate, 
      handleInputErrors,
    createProduct
  );
  router.post('/product/image', authenticate, uploadImageP);
  // Actualizar un producto (campos: name, description, price, brand, etc.)
router.patch('/admin/product/:id',
  authenticate,
  // Validaciones de input con express-validator
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('brand').optional().isString(),
  body('price').optional().isNumeric(),
  body('stock').optional().isNumeric(),
  handleInputErrors,
  updateProduct
);

// Eliminar un producto
router.delete('/admin/product/:id', authenticate, deleteProduct);


  router.get('/users', authenticate, getUsers);
  router.patch('/users/:id', authenticate, updateUserRole);
  router.delete('/users/:id', authenticate, deleteUser);

  // Rutas de dispositivos con prefijo consistente "/products/devices"
  router.get('/products/devices', getAllDevices); // GET /products/devices
  router.get('/products/devices/:deviceId/history', getDeviceHistory); // GET /products/devices/:deviceId/history
  router.post('/products/devices/:deviceId/command', sendCommandToDevice); // POST /products/devices/:deviceId/command

  router.post(
    '/devices/register',
    [
      authenticate, // El usuario debe estar autenticado
      body('deviceId').notEmpty().withMessage('El deviceId es obligatorio'),
      handleInputErrors
    ],
    registerDevice
  );

  // Endpoint para consultar el dispositivo del usuario
  router.get('/devices/me', authenticate, getMyDevice);

  router.post(
    '/devices/register',
    [
      authenticate, // El usuario debe estar autenticado
      body('deviceId').notEmpty().withMessage('El deviceId es obligatorio'),
      handleInputErrors
    ],
    registerDevice
  );
  

  router.get('/admin/pagina/:paginaName', authenticate, getPagina);
  router.patch(
    '/admin/pagina/:paginaName',
    authenticate,
    body('quienesSomos').optional().isString(),
    body('preguntasFrecuentes').optional().isString(),
    body('mision').optional().isString(),
    body('vision').optional().isString(),
    body('valores').optional().isString(),
    body('contacto').optional().isString(),
    body('terminos').optional().isString(),
    handleInputErrors,
    updatePagina
  );
  
  // Endpoint público para obtener el contenido de la página
  router.get('/pagina/:paginaName', getPaginaPublic);
  router.post('/users/push-token', authenticate, savePushToken); 
  export default router;
  