// models/Task.js (Versión ESM)
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// En ESM, la exportación por defecto es la más limpia para los modelos
const Task = mongoose.model('Task', taskSchema);
export default Task;