// config/db.js
import mongoose from 'mongoose'; // Corregimos el typo 'mongose'

const connectDB = async () => {
  try {
    // Usamos la URI de tu .env
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tu_base_de_datos');
    console.log('Conectado a MongoDB con éxito');
  } catch (error) {
    console.error('Error de conexión a MongoDB:', error.message);
    process.exit(1);
  }
};

// Exportamos solo la función de conexión
export default connectDB;