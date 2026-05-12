// userController.js (Versión ESM)
import User from '../models/User.js';
import Task from '../models/Task.js';

export const getProfile = async (req, res) => {
  try {
    // Solo algunos campos: username, role, email
    const user = await User.findById(req.user.id).select('username role email');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Solo admins pueden usar esta ruta
    const users = await User.find().select('username password role');

    // Contar tareas por usuario
    const usersWithTaskCount = await Promise.all(users.map(async (user) => {
      const taskCount = await Task.countDocuments({ userId: user._id });
      return {
        _id: user._id,
        username: user.username,
        password: user.password,
        role: user.role,
        taskCount
      };
    }));

    res.json(usersWithTaskCount);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};