// authController.js (Versión ESM)
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // ¡No olvides el .js aquí!

// Funciones internas (se quedan igual, pero con sintaxis de flecha)
const generarToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generarRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
};

// Exportación de funciones controladoras
export const register = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const userExist = await User.findOne({ username });
    if (userExist) return res.status(400).json({ message: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role: role || 'user' });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el registro' });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const accessToken = generarToken(user);
    const refreshToken = generarRefreshToken(user);

    res.json({ accessToken, refreshToken, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

export const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.REFRESH_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);

    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken });
  });
};