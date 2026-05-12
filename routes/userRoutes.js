
import { Router } from 'express';
import { getProfile, getAllUsers } from '../controllers/userController.js';
import verifyToken from '../middlewares/authMiddleware.js';
import checkRole from '../middlewares/roleMiddleware.js';

const router = Router(); 
// Rutas protegidas: requiere token
router.use(verifyToken);

router.get('/profile', getProfile);

// Solo admin puede listar usuarios
router.get('/', checkRole(['admin']), getAllUsers);

export default router;
