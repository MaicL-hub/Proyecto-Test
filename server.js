// server.js 
import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'; 
import  apiguard  from 'apiguard-js';

// Importamos las rutas 
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- APIGuard Middleware ---
// Se inicializa y se coloca antes que el resto para máxima seguridad
const guard = apiguard();


// Middlewares estándar
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));
app.use(guard);
// Conectar a la base de datos
connectDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`APIGuard protegiendo servidor en http://localhost:${PORT}`);
});