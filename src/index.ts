//index.ts
import colors from 'colors';
import server from './server'; // <-- Importamos 'server' en vez de 'app'

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor y Socket.IO corriendo en el puerto ${PORT}`);
});
