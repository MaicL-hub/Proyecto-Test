// routes/authRoutes.js
import { Router } from 'express'; // 1. Importamos la clase Router
import { register, login, refreshToken } from '../controllers/authController.js';

const router = Router(); 

// 3. Ahora sí podemos usar 'router'
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

export default router;