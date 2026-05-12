const API_URL = '/api/tasks';
const USER_API_URL = '/api/users';
const token = localStorage.getItem('accessToken');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token
};

function cerrarSesion() {
  localStorage.removeItem('accessToken'); 
  window.location.href = '/login.html';  
}

function manejarErrorAutenticacion(res) {
  if (res.status === 401 || res.status === 403) {
    alert('Sesión expirada. Por favor inicia sesión nuevamente.');
    localStorage.removeItem('accessToken'); 
    window.location.href = '/login.html'; 
    return true; 
  }
  return false;
}

// Decodifica payload JWT para obtener datos usuario
function obtenerPayloadToken(token) {
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

const userPayload = obtenerPayloadToken(token);

async function cargarTareas() {
  document.getElementById('pageTitle').textContent = 'Mis Tareas';
  document.getElementById('taskForm').style.display = 'flex';
  document.getElementById('taskList').style.display = 'flex';
  document.getElementById('userTableContainer').style.display = 'none';

  const res = await fetch(API_URL, { headers });
  if (manejarErrorAutenticacion(res)) return;

  const tareas = await res.json();
  const lista = document.getElementById('taskList');
  lista.innerHTML = '';

  tareas.forEach(t => {
    const div = document.createElement('div');
    div.className = 'task';

    const titleStyle = t.completed ? 'text-decoration: line-through; color: #6c757d;' : '';

    div.innerHTML = `
      <div class="task-info" style="max-width: 75%; display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleCompleted('${t._id}', this.checked)" />
        <div style="${titleStyle}">
          <strong class="task-title">${escapeHtml(t.title)}</strong><br/>
          <span class="task-desc">${escapeHtml(t.description || '')}</span>
        </div>
      </div>
      <div>
        <button onclick="editarTarea('${t._id}', this)">Editar</button>
        <button onclick="borrarTarea('${t._id}')">Eliminar</button>
      </div>
    `;
    lista.appendChild(div);
  });
}

async function cargarUsuarios() {
  document.getElementById('pageTitle').textContent = 'Usuarios';
  document.getElementById('taskForm').style.display = 'none';
  document.getElementById('taskList').style.display = 'none';
  document.getElementById('userTableContainer').style.display = 'block';

  const res = await fetch(USER_API_URL, { headers });
  if (manejarErrorAutenticacion(res)) return;

  if (!res.ok) {
    alert('Error al cargar usuarios');
    return;
  }

  const users = await res.json();
  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.role)}</td>
      <td style="text-align:center;">${u.taskCount || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}


// Función para escapar HTML (evitar inyección)
function escapeHtml(text) {
  if (typeof text !== 'string') return ''; // Devuelve cadena vacía si no es string
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

async function crearTarea() {
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!title) {
    alert('El título es obligatorio.');
    return;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, description })
  });

  if (manejarErrorAutenticacion(res)) return;

  if (!res.ok) {
    const data = await res.json();
    alert('Error al crear tarea: ' + (data.message || 'desconocido'));
    return;
  }

  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  cargarTareas();
}

async function borrarTarea(id) {
  if (!confirm('¿Seguro que quieres eliminar esta tarea?')) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers
    });

    if (manejarErrorAutenticacion(res)) return;

    if (!res.ok) {
      const errorData = await res.json();
      alert('Error al eliminar: ' + (errorData.message || 'Error desconocido'));
      return;
    }

    await res.json();
    cargarTareas();
  } catch (error) {
    alert('Error de conexión al servidor.');
  }
}

async function toggleCompleted(id, completed) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ completed })
  });
  cargarTareas();
}

function editarTarea(id, btn) {
  const taskDiv = btn.closest('.task');
  const titleEl = taskDiv.querySelector('.task-title');
  const descEl = taskDiv.querySelector('.task-desc');

  if (taskDiv.querySelector('input.edit-title')) return;

  const currentTitle = titleEl.textContent;
  const currentDesc = descEl.textContent;

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = currentTitle;
  titleInput.className = 'edit-title';

  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.value = currentDesc;
  descInput.className = 'edit-desc';

  titleEl.replaceWith(titleInput);
  descEl.replaceWith(descInput);

  btn.textContent = 'Guardar';
  btn.onclick = async () => {
    const newTitle = titleInput.value.trim();
    const newDesc = descInput.value.trim();

    if (!newTitle) {
      alert('El título no puede estar vacío.');
      return;
    }

    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title: newTitle, description: newDesc })
    });

    cargarTareas();
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.style.marginLeft = '8px';
  cancelBtn.onclick = () => cargarTareas();

  btn.insertAdjacentElement('afterend', cancelBtn);
}

// Mostrar botones admin si corresponde
function configurarVistaPorRol() {
  if (userPayload && userPayload.role === 'admin') {
    document.getElementById('adminBtns').style.display = 'flex';

    document.getElementById('btnUsuarios').onclick = cargarUsuarios;
    document.getElementById('btnMisTareas').onclick = cargarTareas;
  } else {
    // No admin: oculta botones admin
    document.getElementById('adminBtns').style.display = 'none';
  }
}

// Inicializar
configurarVistaPorRol();
cargarTareas();
