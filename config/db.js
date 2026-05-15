// config/db.js
import mongoose from 'mongoose'; // Corregimos el typo 'mongose'

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('Ya conectado a MongoDB');
    return;
  }

  const maxRetries = 3;
  let retries = 0;

  const attemptConnection = async () => {
    try {
      // Usamos la URI de tu .env
      const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/tu_base_de_datos';
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
      });
      console.log('Conectado a MongoDB con éxito');
    } catch (error) {
      retries++;
      console.error(`Error de conexión a MongoDB (intento ${retries}/${maxRetries}):`, error.message);
      
      if (retries < maxRetries) {
        console.log('Reintentando en 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return attemptConnection();
      } else {
        console.warn('No se pudo conectar a MongoDB. El servidor continuará sin conexión.');
        // No hacemos process.exit(1) para que Vercel no falle
      }
    }
  };

  return attemptConnection();
};

// Exportamos solo la función de conexión
export default connectDB;