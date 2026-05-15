// api/index.js - Vercel Serverless Handler
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from '../config/db.js';
import apiguard from 'apiguard-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Importamos las rutas
import authRoutes from '../routes/authRoutes.js';
import taskRoutes from '../routes/taskRoutes.js';
import userRoutes from '../routes/userRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// --- APIGuard Middleware ---
const guard = apiguard();

// Middlewares estándar
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173', 'https://proyecto-test-pi.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir archivos estáticos PRIMERO (importante para Vercel)
app.use(express.static(join(__dirname, '../public')));

app.use(guard);

// Conectar a la base de datos (sin bloquear)
connectDB().catch(err => console.error('MongoDB connection error:', err));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Fallback para SPA - sirve index.html para rutas no definidas
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Exportar para Vercel
export default app;
