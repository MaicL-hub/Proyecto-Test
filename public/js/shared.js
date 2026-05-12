(() => {
  const STORAGE_KEYS = {
    accessToken: 'controlTareas.accessToken',
    refreshToken: 'controlTareas.refreshToken',
    role: 'controlTareas.role',
    theme: 'controlTareas.theme',
    density: 'controlTareas.density',
    notifications: 'controlTareas.notifications'
  };

  let modalCleanup = null;
  let authFailureHandled = false;

  const safeStorage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } catch {
        return null;
      }
      return value;
    }
  };

  function decodeJwt(token) {
    if (!token || typeof token !== 'string') return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  function getSession() {
    return {
      accessToken: safeStorage.get(STORAGE_KEYS.accessToken),
      refreshToken: safeStorage.get(STORAGE_KEYS.refreshToken),
      role: safeStorage.get(STORAGE_KEYS.role),
      theme: safeStorage.get(STORAGE_KEYS.theme) || 'aurora',
      density: safeStorage.get(STORAGE_KEYS.density) || 'comfortable',
      notifications: safeStorage.get(STORAGE_KEYS.notifications) !== 'off'
    };
  }

  function getCurrentUser() {
    const session = getSession();
    const payload = decodeJwt(session.accessToken);

    if (!payload) return null;

    return {
      ...payload,
      role: session.role || payload.role || 'user',
      tokenPayload: payload
    };
  }

  function setSession({ accessToken, refreshToken, role }) {
    if (accessToken) safeStorage.set(STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken) safeStorage.set(STORAGE_KEYS.refreshToken, refreshToken);
    if (role) safeStorage.set(STORAGE_KEYS.role, role);
  }

  function clearSession() {
    Object.values(STORAGE_KEYS).forEach((key) => safeStorage.set(key, null));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateTime(value) {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  function formatRelativeTime(value) {
    if (!value) return 'Hace un momento';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Hace un momento';

    const diff = Math.round((Date.now() - date.getTime()) / 1000);
    const table = [
      ['año', 60 * 60 * 24 * 365],
      ['mes', 60 * 60 * 24 * 30],
      ['dia', 60 * 60 * 24],
      ['hora', 60 * 60],
      ['minuto', 60]
    ];

    for (const [label, seconds] of table) {
      if (Math.abs(diff) >= seconds) {
        const amount = Math.floor(Math.abs(diff) / seconds);
        return diff >= 0 ? `hace ${amount} ${label}${amount > 1 ? 's' : ''}` : `en ${amount} ${label}${amount > 1 ? 's' : ''}`;
      }
    }

    return diff >= 0 ? 'hace unos segundos' : 'en unos segundos';
  }

  function applyPreferences() {
    const session = getSession();
    document.documentElement.dataset.theme = session.theme;
    document.documentElement.dataset.density = session.density;
    document.body.dataset.theme = session.theme;
    document.body.dataset.density = session.density;
  }

  function setPreference(key, value) {
    safeStorage.set(key, value);
    applyPreferences();
  }

  function ensureToastRoot() {
    let root = document.getElementById('toastRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toastRoot';
      root.className = 'toast-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function notify(message, type = 'info', options = {}) {
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="mark" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(options.title || (type === 'success' ? 'Listo' : type === 'warning' ? 'Atencion' : type === 'error' ? 'Error' : 'Aviso'))}</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
    root.appendChild(toast);

    const timeout = typeof options.timeout === 'number' ? options.timeout : 3600;
    window.setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
      window.setTimeout(() => toast.remove(), 180);
    }, timeout);

    return toast;
  }

  function ensureModalRoot() {
    let root = document.getElementById('modalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modalRoot';
      root.className = 'modal-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function closeModal() {
    const root = ensureModalRoot();
    root.innerHTML = '';
    document.body.classList.remove('modal-open');
    if (typeof modalCleanup === 'function') {
      modalCleanup();
      modalCleanup = null;
    }
  }

  function openModal({ title, bodyHtml, footerHtml, size = 'md', onMount }) {
    const root = ensureModalRoot();
    document.body.classList.add('modal-open');
    root.innerHTML = `
      <div class="modal-overlay" role="presentation">
        <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <div class="modal-head">
            <div>
              <h3 id="modalTitle">${escapeHtml(title || '')}</h3>
            </div>
            <button class="modal-close" type="button" aria-label="Cerrar modal" data-modal-close>×</button>
          </div>
          <div class="modal-body">
            ${bodyHtml || ''}
          </div>
          ${footerHtml ? `<div class="modal-foot">${footerHtml}</div>` : ''}
        </div>
      </div>
    `;

    const overlay = root.querySelector('.modal-overlay');
    const modal = root.querySelector('.modal');
    const closeButtons = root.querySelectorAll('[data-modal-close]');

    const handleClose = (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    };

    overlay.addEventListener('click', handleClose);
    closeButtons.forEach((button) => button.addEventListener('click', closeModal));

    modalCleanup = () => {
      overlay.removeEventListener('click', handleClose);
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    };

    document.addEventListener('keydown', handleEsc);
    modalCleanup = () => {
      overlay.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleEsc);
    };

    if (typeof onMount === 'function') {
      onMount(modal);
    }

    return { close: closeModal, modal };
  }

  async function apiFetch(url, options = {}) {
    const session = getSession();
    const {
      auth = true,
      headers = {},
      silent = false,
      ...rest
    } = options;

    const requestHeaders = new Headers(headers);
    const body = rest.body;

    if (auth && session.accessToken) {
      requestHeaders.set('Authorization', `Bearer ${session.accessToken}`);
    }

    if (body && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...rest,
      headers: requestHeaders
    });

    if (auth && (response.status === 401 || response.status === 403)) {
      if (!authFailureHandled) {
        authFailureHandled = true;
        if (!silent) {
          notify('La sesion expiro. Vuelve a iniciar sesion.', 'warning', { title: 'Sesion expirada' });
        }
        clearSession();
        if (!/\/login\.html$|\/register\.html$/.test(window.location.pathname)) {
          window.setTimeout(() => {
            window.location.href = '/login.html';
          }, 450);
        }
      }
      throw new Error(`Auth error: ${response.status}`);
    }

    return response;
  }

  function requireAuth(redirectTo = '/login.html') {
    if (!getSession().accessToken) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  function logout(message = 'Sesion cerrada', redirectTo = '/login.html') {
    clearSession();
    notify(message, 'info', { title: 'Hasta pronto' });
    window.setTimeout(() => {
      window.location.href = redirectTo;
    }, 120);
  }

  function bindThemeControls() {
    const themeSelect = document.querySelector('[data-setting="theme"]');
    const densitySelect = document.querySelector('[data-setting="density"]');
    const notificationsToggle = document.querySelector('[data-setting="notifications"]');

    if (themeSelect) {
      themeSelect.value = getSession().theme;
      themeSelect.addEventListener('change', () => setPreference(STORAGE_KEYS.theme, themeSelect.value));
    }

    if (densitySelect) {
      densitySelect.value = getSession().density;
      densitySelect.addEventListener('change', () => setPreference(STORAGE_KEYS.density, densitySelect.value));
    }

    if (notificationsToggle) {
      notificationsToggle.checked = getSession().notifications;
      notificationsToggle.addEventListener('change', () => {
        safeStorage.set(STORAGE_KEYS.notifications, notificationsToggle.checked ? 'on' : 'off');
        notify(notificationsToggle.checked ? 'Las notificaciones visuales estan activadas.' : 'Las notificaciones visuales estan desactivadas.', 'info');
      });
    }
  }

  function initSharedUi() {
    applyPreferences();
    document.body.dataset.ready = 'true';
    bindThemeControls();
  }

  window.APP = {
    STORAGE_KEYS,
    decodeJwt,
    getSession,
    getCurrentUser,
    setSession,
    clearSession,
    escapeHtml,
    formatDateTime,
    formatRelativeTime,
    applyPreferences,
    setPreference,
    notify,
    openModal,
    closeModal,
    apiFetch,
    requireAuth,
    logout,
    initSharedUi
  };

  document.addEventListener('DOMContentLoaded', initSharedUi);
})();
