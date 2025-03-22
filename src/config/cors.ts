  //SRC/CORS
  import { CorsOptions } from 'cors';

  export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const whiteList = [
        process.env.FRONTEND_URL,             // React Web (ya definido)
        process.env.FROTEND_REACT_LOCAL,              // React Native en emulador
        process.env.FROTEND_REACT       // React Native en dispositivo físico (cambia a tu IP real)
      ];

      if (whiteList.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    }
  };
