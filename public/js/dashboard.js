(() => {
  const state = {
    profile: null,
    tasks: [],
    users: [],
    view: 'overview',
    taskFilter: 'all',
    taskQuery: '',
    selectedTaskId: null
  };

  const refs = {};

  function getRole() {
    return state.profile?.role || window.APP.getCurrentUser()?.role || window.APP.getSession().role || 'user';
  }

  function cacheRefs() {
    refs.pageTitle = document.getElementById('pageTitle');
    refs.pageSubtitle = document.getElementById('pageSubtitle');
    refs.userName = document.getElementById('userName');
    refs.userRole = document.getElementById('userRole');
    refs.userBadge = document.getElementById('userBadge');
    refs.navButtons = Array.from(document.querySelectorAll('[data-view-btn]'));
    refs.viewSections = Array.from(document.querySelectorAll('[data-view]'));
    refs.overviewStats = document.getElementById('overviewStats');
    refs.overviewActivity = document.getElementById('overviewActivity');
    refs.taskList = document.getElementById('taskList');
    refs.taskSearch = document.getElementById('taskSearch');
    refs.taskFilter = document.getElementById('taskFilter');
    refs.taskCounter = document.getElementById('taskCounter');
    refs.profileContent = document.getElementById('profileContent');
    refs.usersContent = document.getElementById('usersContent');
    refs.reportsContent = document.getElementById('reportsContent');
    refs.settingsContent = document.getElementById('settingsContent');
    refs.createTaskButtons = Array.from(document.querySelectorAll('[data-open-create-task]'));
    refs.quickTaskBtn = document.getElementById('quickTaskBtn');
    refs.logoutBtn = document.getElementById('logoutBtn');
    refs.quickLogoutBtn = document.getElementById('quickLogoutBtn');
  }

  function bindEvents() {
    refs.navButtons.forEach((button) => {
      button.addEventListener('click', () => goToView(button.dataset.viewBtn));
    });

    [...(refs.createTaskButtons || []), refs.quickTaskBtn].forEach((button) => {
      if (button) {
        button.addEventListener('click', () => openTaskModal());
      }
    });

    [refs.logoutBtn, refs.quickLogoutBtn].forEach((button) => {
      if (button) {
        button.addEventListener('click', () => window.APP.logout());
      }
    });

    if (refs.taskSearch) {
      refs.taskSearch.addEventListener('input', () => {
        state.taskQuery = refs.taskSearch.value.trim().toLowerCase();
        renderTasks();
      });
    }

    if (refs.taskFilter) {
      refs.taskFilter.addEventListener('change', () => {
        state.taskFilter = refs.taskFilter.value;
        renderTasks();
      });
    }

    window.addEventListener('hashchange', () => {
      const view = window.location.hash.replace('#', '') || 'overview';
      goToView(view, { silent: true });
    });
  }

  async function loadProfile() {
    const response = await window.APP.apiFetch('/api/users/profile');
    const data = await response.json();
    state.profile = data;
    renderUserBadge();
    renderProfile();
    renderSettings();
  }

  async function loadTasks() {
    const response = await window.APP.apiFetch('/api/tasks');
    const data = await response.json();
    state.tasks = Array.isArray(data) ? data : [];
    renderOverview();
    renderTasks();
    renderReports();
    renderActivity();
  }

  async function loadUsers() {
    if (getRole() !== 'admin') {
      state.users = [];
      renderUsers();
      renderReports();
      return;
    }

    const response = await window.APP.apiFetch('/api/users');
    const data = await response.json();
    state.users = Array.isArray(data) ? data : [];
    renderUsers();
    renderReports();
    renderOverview();
  }

  function renderUserBadge() {
    const user = state.profile || window.APP.getCurrentUser();
    if (!user) return;

    if (refs.userName) refs.userName.textContent = user.username || 'Usuario';
    if (refs.userRole) refs.userRole.textContent = getRole() === 'admin' ? 'Administrador' : 'Usuario';
    if (refs.userBadge) refs.userBadge.textContent = getRole() === 'admin' ? 'Admin workspace' : 'Personal workspace';
  }

  function goToView(view, options = {}) {
    const allowedViews = ['overview', 'tasks', 'profile', 'users', 'reports', 'settings'];
    const nextView = allowedViews.includes(view) ? view : 'overview';

    if (nextView === 'users' && getRole() !== 'admin') {
      if (!options.silent) {
        window.APP.notify('Solo un administrador puede abrir la seccion de usuarios.', 'warning');
      }
      return goToView('overview', { silent: true });
    }

    state.view = nextView;

    if (!options.silent) {
      window.location.hash = nextView;
    }

    refs.navButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.viewBtn === nextView);
    });

    refs.viewSections.forEach((section) => {
      section.classList.toggle('active', section.dataset.view === nextView);
    });

    const titles = {
      overview: ['Dashboard', 'Resumen de actividad, tareas y accesos rapidos.'],
      tasks: ['Tareas', 'Crea, filtra, edita y elimina tareas desde el panel central.'],
      profile: ['Perfil', 'Consulta tus datos de acceso y estado de la sesion.'],
      users: ['Usuarios', 'Vista administrativa con el listado de cuentas y actividad.'],
      reports: ['Reportes', 'Indicadores operativos generados desde la actividad registrada.'],
      settings: ['Ajustes', 'Personaliza la apariencia y el comportamiento visual del panel.']
    };

    if (refs.pageTitle) refs.pageTitle.textContent = titles[nextView][0];
    if (refs.pageSubtitle) refs.pageSubtitle.textContent = titles[nextView][1];
  }

  function buildMetricCard(value, label, tone = '') {
    return `
      <article class="stat-card ${tone}">
        <strong class="value">${window.APP.escapeHtml(value)}</strong>
        <span class="label">${window.APP.escapeHtml(label)}</span>
      </article>
    `;
  }

  function getTaskStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.completed).length;
    const pending = total - completed;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const recentTasks = state.tasks.filter((task) => {
      if (!task.createdAt) return false;
      const created = new Date(task.createdAt).getTime();
      return Date.now() - created <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      total,
      completed,
      pending,
      completionRate,
      recentTasks
    };
  }

  function getFilteredTasks() {
    const query = state.taskQuery;
    const filter = state.taskFilter;

    return state.tasks.filter((task) => {
      const title = String(task.title || '').toLowerCase();
      const description = String(task.description || '').toLowerCase();
      const matchesQuery = !query || title.includes(query) || description.includes(query);
      const matchesFilter = filter === 'all'
        || (filter === 'completed' && task.completed)
        || (filter === 'pending' && !task.completed);
      return matchesQuery && matchesFilter;
    });
  }

  function renderOverview() {
    if (!refs.overviewStats) return;

    const stats = getTaskStats();
    const adminUsers = state.users.length;
    const orgTasks = state.users.reduce((sum, user) => sum + (user.taskCount || 0), 0);

    const cards = [
      buildMetricCard(stats.total, 'Tareas totales', 'accent'),
      buildMetricCard(stats.completed, 'Completadas', 'success'),
      buildMetricCard(stats.pending, 'Pendientes', 'warning'),
      buildMetricCard(`${stats.completionRate}%`, 'Avance general', 'accent')
    ];

    if (getRole() === 'admin') {
      cards.push(buildMetricCard(adminUsers, 'Usuarios registrados'));
      cards.push(buildMetricCard(orgTasks, 'Tareas visibles en admins'));
    }

    refs.overviewStats.innerHTML = cards.join('');

    if (refs.overviewActivity) {
      const recent = [...state.tasks]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 4)
        .map((task) => `
          <article class="activity-card">
            <div class="task-meta" style="margin-bottom:10px;">
              <span class="badge ${task.completed ? 'success' : 'warning'}">${task.completed ? 'Completada' : 'Pendiente'}</span>
              <span class="badge accent">${window.APP.escapeHtml(window.APP.formatRelativeTime(task.createdAt))}</span>
            </div>
            <strong>${window.APP.escapeHtml(task.title)}</strong>
            <p>${window.APP.escapeHtml(task.description || 'Sin descripcion')}</p>
          </article>
        `)
        .join('');

      refs.overviewActivity.innerHTML = `
        <div class="panel-head">
          <div>
            <h3>Actividad reciente</h3>
            <p>Las ultimas tareas creadas o actualizadas en tu espacio.</p>
          </div>
          <button class="subtle-button" type="button" data-open-tasks="true">Ir a tareas</button>
        </div>
        <div class="grid" style="gap:12px;">${recent || '<div class="list-empty">Aun no hay actividad para mostrar.</div>'}</div>
      `;

      const jumpButton = refs.overviewActivity.querySelector('[data-open-tasks]');
      if (jumpButton) {
        jumpButton.addEventListener('click', () => goToView('tasks'));
      }
    }
  }

  function renderActivity() {
    renderOverview();
  }

  function renderTasks() {
    if (!refs.taskList) return;

    const filtered = getFilteredTasks();
    if (refs.taskCounter) {
      refs.taskCounter.textContent = `${filtered.length} tarea${filtered.length === 1 ? '' : 's'}`;
    }

    if (!filtered.length) {
      refs.taskList.innerHTML = `
        <div class="list-empty">
          <strong>No hay tareas que coincidan con los filtros.</strong>
          <p style="margin:10px 0 0;">Crea una nueva tarea o cambia el filtro para ver resultados.</p>
        </div>
      `;
      return;
    }

    refs.taskList.innerHTML = filtered.map((task) => {
      const completed = Boolean(task.completed);
      return `
        <article class="task-card ${completed ? 'completed' : ''}" data-task-id="${task._id}">
          <header>
            <div>
              <div class="task-meta">
                <span class="badge ${completed ? 'success' : 'warning'}">${completed ? 'Hecha' : 'Pendiente'}</span>
                <span class="badge accent">${window.APP.escapeHtml(window.APP.formatDateTime(task.createdAt))}</span>
              </div>
              <h3>${window.APP.escapeHtml(task.title)}</h3>
            </div>
            <label class="toggle" title="Marcar como completada">
              <input type="checkbox" ${completed ? 'checked' : ''} data-toggle-task="${task._id}">
              <span></span>
            </label>
          </header>
          <p>${window.APP.escapeHtml(task.description || 'Sin descripcion')}</p>
          <div class="task-actions">
            <button class="subtle-button" type="button" data-edit-task="${task._id}">Editar</button>
            <button class="ghost-button" type="button" data-delete-task="${task._id}">Eliminar</button>
          </div>
        </article>
      `;
    }).join('');

    refs.taskList.querySelectorAll('[data-edit-task]').forEach((button) => {
      button.addEventListener('click', () => {
        const task = state.tasks.find((item) => item._id === button.dataset.editTask);
        openTaskModal(task);
      });
    });

    refs.taskList.querySelectorAll('[data-delete-task]').forEach((button) => {
      button.addEventListener('click', () => confirmDeleteTask(button.dataset.deleteTask));
    });

    refs.taskList.querySelectorAll('[data-toggle-task]').forEach((input) => {
      input.addEventListener('change', () => toggleTask(input.dataset.toggleTask, input.checked));
    });
  }

  function renderProfile() {
    if (!refs.profileContent) return;
    const profile = state.profile || {};

    refs.profileContent.innerHTML = `
      <div class="profile-card">
        <div class="section-title">
          <div>
            <span class="kicker">Perfil de sesion</span>
            <h2>${window.APP.escapeHtml(profile.username || 'Usuario')}</h2>
          </div>
          <span class="badge ${getRole() === 'admin' ? 'accent' : 'success'}">${getRole() === 'admin' ? 'Administrador' : 'Usuario'}</span>
        </div>
        <div class="profile-grid">
          <div class="soft-card" style="padding:16px;">
            <strong>Nombre de usuario</strong>
            <p class="helper">${window.APP.escapeHtml(profile.username || 'Sin datos')}</p>
          </div>
          <div class="soft-card" style="padding:16px;">
            <strong>Rol</strong>
            <p class="helper">${window.APP.escapeHtml(profile.role || getRole())}</p>
          </div>
          <div class="soft-card" style="padding:16px;">
            <strong>Email</strong>
            <p class="helper">${window.APP.escapeHtml(profile.email || 'No registrado')}</p>
          </div>
          <div class="soft-card" style="padding:16px;">
            <strong>Ultimo acceso</strong>
            <p class="helper">${window.APP.escapeHtml(window.APP.formatDateTime(new Date()))}</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderUsers() {
    if (!refs.usersContent) return;

    if (getRole() !== 'admin') {
      refs.usersContent.innerHTML = `
        <div class="list-empty">
          <strong>Acceso restringido.</strong>
          <p style="margin:10px 0 0;">La vista de usuarios solo esta disponible para administradores.</p>
        </div>
      `;
      return;
    }

    if (!state.users.length) {
      refs.usersContent.innerHTML = '<div class="list-empty">No hay usuarios cargados todavia.</div>';
      return;
    }

    refs.usersContent.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Tareas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${state.users.map((user) => `
              <tr>
                <td>
                  <strong>${window.APP.escapeHtml(user.username)}</strong>
                  <div class="helper">${window.APP.escapeHtml(user._id)}</div>
                </td>
                <td>${window.APP.escapeHtml(user.role)}</td>
                <td>${window.APP.escapeHtml(user.taskCount || 0)}</td>
                <td><span class="badge ${user.role === 'admin' ? 'accent' : 'success'}">${user.role === 'admin' ? 'Administrador' : 'Activo'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderReports() {
    if (!refs.reportsContent) return;

    const stats = getTaskStats();
    const tasksByDay = buildDailySeries(state.tasks);
    const userCount = state.users.length;
    const totalOrgTasks = state.users.reduce((sum, user) => sum + (user.taskCount || 0), 0);
    const averageTasksPerUser = userCount ? (totalOrgTasks / userCount).toFixed(1) : '0.0';

    refs.reportsContent.innerHTML = `
      <div class="report-grid">
        <div class="report-card">
          <div class="panel-head">
            <div>
              <h3>Resumen operativo</h3>
              <p>Metricas calculadas desde tus tareas registradas.</p>
            </div>
            <span class="badge accent">Actualizado en vivo</span>
          </div>
          <div class="grid" style="gap:12px;">
            <div class="metric-stack"><strong>${stats.total}</strong><span>Tareas creadas</span></div>
            <div class="metric-stack"><strong>${stats.completed}</strong><span>Tareas completadas</span></div>
            <div class="metric-stack"><strong>${stats.pending}</strong><span>Tareas pendientes</span></div>
            <div class="metric-stack"><strong>${stats.recentTasks}</strong><span>Creada en los ultimos 7 dias</span></div>
          </div>
        </div>
        <div class="report-card">
          <div class="panel-head">
            <div>
              <h3>Distribucion</h3>
              <p>Estados y avance general del trabajo.</p>
            </div>
          </div>
          <div class="progress">
            <div>
              <div class="helper" style="margin-bottom:8px;">Completadas ${stats.completionRate}%</div>
              <div class="progress-bar"><span style="width:${stats.completionRate}%"></span></div>
            </div>
            <div>
              <div class="helper" style="margin-bottom:8px;">Pendientes ${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%</div>
              <div class="progress-bar"><span style="width:${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}%; background: linear-gradient(90deg, var(--warning), #ffd89f);"></span></div>
            </div>
          </div>
        </div>
        <div class="report-card wide">
          <div class="panel-head">
            <div>
              <h3>Actividad por fecha</h3>
              <p>Las ultimas 7 fechas con tareas creadas o modificadas.</p>
            </div>
          </div>
          <div class="grid" style="gap:10px;">
            ${tasksByDay.map((entry) => `
              <div class="progress">
                <div class="helper" style="display:flex;justify-content:space-between;gap:12px;">
                  <span>${window.APP.escapeHtml(entry.label)}</span>
                  <span>${entry.value}</span>
                </div>
                <div class="progress-bar"><span style="width:${entry.max ? Math.max(12, Math.round((entry.value / entry.max) * 100)) : 12}%"></span></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="report-card wide">
          <div class="panel-head">
            <div>
              <h3>Lectura administrativa</h3>
              <p>Disponible cuando existe rol de administrador.</p>
            </div>
          </div>
          <div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
            <div class="metric-stack"><strong>${userCount}</strong><span>Usuarios totales</span></div>
            <div class="metric-stack"><strong>${totalOrgTasks}</strong><span>Tareas contabilizadas por admins</span></div>
            <div class="metric-stack"><strong>${averageTasksPerUser}</strong><span>Promedio de tareas por usuario</span></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSettings() {
    if (!refs.settingsContent) return;

    const session = window.APP.getSession();

    refs.settingsContent.innerHTML = `
      <div class="settings-card">
        <div class="panel-head">
          <div>
            <h3>Preferencias visuales</h3>
            <p>Los cambios se guardan en tu navegador.</p>
          </div>
        </div>
        <div class="settings-grid">
          <label class="form-label">
            <span>Tema</span>
            <select class="select" data-setting="theme">
              <option value="aurora">Aurora</option>
              <option value="ivory">Ivory</option>
            </select>
          </label>
          <label class="form-label">
            <span>Densidad</span>
            <select class="select" data-setting="density">
              <option value="comfortable">Comoda</option>
              <option value="compact">Compacta</option>
            </select>
          </label>
        </div>
        <div class="settings-list" style="margin-top:16px;">
          <div class="setting-row">
            <div class="copy">
              <strong>Notificaciones visuales</strong>
              <span>Activa o desactiva los avisos tipo toast.</span>
            </div>
            <label class="toggle">
              <input type="checkbox" data-setting="notifications" ${session.notifications ? 'checked' : ''}>
              <span></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="copy">
              <strong>Accion rapida</strong>
              <span>Abre el modal para crear una tarea nueva.</span>
            </div>
            <button class="primary-button" type="button" data-open-create-task>Crear tarea</button>
          </div>
          <div class="setting-row">
            <div class="copy">
              <strong>Cerrar sesion</strong>
              <span>Sal del panel y vuelve a la pantalla de acceso.</span>
            </div>
            <button class="ghost-button" type="button" data-open-logout>Salir</button>
          </div>
        </div>
      </div>
    `;

    refs.settingsContent.querySelector('[data-open-create-task]')?.addEventListener('click', () => openTaskModal());
    refs.settingsContent.querySelector('[data-open-logout]')?.addEventListener('click', () => window.APP.logout());
    window.APP.initSharedUi();
  }

  function buildDailySeries(tasks) {
    const labels = [];
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      labels.push({
        key,
        label: new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit' }).format(date),
        value: 0
      });
    }

    tasks.forEach((task) => {
      if (!task.createdAt) return;
      const key = new Date(task.createdAt).toISOString().slice(0, 10);
      const bucket = labels.find((entry) => entry.key === key);
      if (bucket) bucket.value += 1;
    });

    const max = Math.max(1, ...labels.map((entry) => entry.value));
    return labels.map((entry) => ({ ...entry, max }));
  }

  function taskModalMarkup(task = null) {
    const isEdit = Boolean(task);
    return `
      <form class="form-grid" id="taskModalForm">
        <label class="form-label">
          <span>Titulo</span>
          <input class="field" name="title" maxlength="120" value="${window.APP.escapeHtml(task?.title || '')}" placeholder="Ej. Revisar entregas" required>
        </label>
        <label class="form-label">
          <span>Descripcion</span>
          <textarea class="textarea" name="description" placeholder="Detalles adicionales">${window.APP.escapeHtml(task?.description || '')}</textarea>
        </label>
        <label class="setting-row" style="border-bottom:0;padding:0;margin-top:2px;">
          <div class="copy">
            <strong>Estado</strong>
            <span>Marca la tarea como completada al guardar.</span>
          </div>
          <label class="toggle">
            <input type="checkbox" name="completed" ${task?.completed ? 'checked' : ''}>
            <span></span>
          </label>
        </label>
        <div class="helper">${isEdit ? 'Puedes cambiar el titulo, la descripcion y el estado.' : 'Crear una tarea nueva la agregara al instante al panel.'}</div>
      </form>
    `;
  }

  function openTaskModal(task = null) {
    const isEdit = Boolean(task);

    window.APP.openModal({
      title: isEdit ? 'Editar tarea' : 'Nueva tarea',
      size: 'md',
      bodyHtml: taskModalMarkup(task),
      footerHtml: `
        <button class="ghost-button" type="button" data-modal-close>Cancelar</button>
        <button class="primary-button" type="submit" form="taskModalForm">${isEdit ? 'Guardar cambios' : 'Crear tarea'}</button>
      `,
      onMount: (modal) => {
        const form = modal.querySelector('#taskModalForm');
        const submitButton = modal.querySelector('[form="taskModalForm"]');

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          submitButton.disabled = true;
          submitButton.textContent = isEdit ? 'Guardando...' : 'Creando...';

          const payload = {
            title: form.title.value.trim(),
            description: form.description.value.trim(),
            completed: form.completed.checked
          };

          try {
            const response = await window.APP.apiFetch(isEdit ? `/api/tasks/${task._id}` : '/api/tasks', {
              method: isEdit ? 'PUT' : 'POST',
              body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || 'No fue posible guardar la tarea');
            }

            window.APP.closeModal();
            window.APP.notify(isEdit ? 'Tarea actualizada.' : 'Tarea creada.', 'success');
            await loadTasks();
            renderOverview();
            goToView('tasks', { silent: true });
          } catch (error) {
            window.APP.notify(error.message || 'Error al guardar la tarea', 'error');
          } finally {
            submitButton.disabled = false;
            submitButton.textContent = isEdit ? 'Guardar cambios' : 'Crear tarea';
          }
        });
      }
    });
  }

  function confirmDeleteTask(taskId) {
    const task = state.tasks.find((item) => item._id === taskId);
    if (!task) return;

    window.APP.openModal({
      title: 'Eliminar tarea',
      bodyHtml: `
        <div class="stack">
          <p class="lead" style="margin:0;">Vas a eliminar la tarea <strong>${window.APP.escapeHtml(task.title)}</strong>. Esta accion no se puede deshacer.</p>
          <div class="soft-card" style="padding:16px;">
            <strong>${window.APP.escapeHtml(task.title)}</strong>
            <p class="helper">${window.APP.escapeHtml(task.description || 'Sin descripcion')}</p>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="ghost-button" type="button" data-modal-close>Cancelar</button>
        <button class="primary-button" type="button" data-confirm-delete>Eliminar</button>
      `,
      size: 'sm',
      onMount: (modal) => {
        modal.querySelector('[data-confirm-delete]')?.addEventListener('click', async () => {
          try {
            const response = await window.APP.apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || 'No fue posible eliminar la tarea');
            }
            window.APP.closeModal();
            window.APP.notify('Tarea eliminada.', 'success');
            await loadTasks();
          } catch (error) {
            window.APP.notify(error.message || 'Error al eliminar la tarea', 'error');
          }
        });
      }
    });
  }

  async function toggleTask(taskId, completed) {
    try {
      const response = await window.APP.apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ completed })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No fue posible actualizar la tarea');
      }

      await loadTasks();
      window.APP.notify(completed ? 'Tarea marcada como completada.' : 'Tarea marcada como pendiente.', 'success');
    } catch (error) {
      window.APP.notify(error.message || 'Error al actualizar la tarea', 'error');
    }
  }

  async function initDashboard() {
    if (!window.APP.requireAuth()) return;

    cacheRefs();
    bindEvents();
    renderUserBadge();

    const initialView = (window.location.hash.replace('#', '') || 'overview');
    goToView(initialView, { silent: true });

    try {
      await loadProfile();
      await loadTasks();
      await loadUsers();
      renderSettings();
      renderOverview();
      renderProfile();
      renderReports();
      renderUsers();
      renderTasks();
      renderActivity();
    } catch (error) {
      if (!error.message.startsWith('Auth error')) {
        window.APP.notify('No fue posible cargar el dashboard.', 'error');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', initDashboard);
})();
