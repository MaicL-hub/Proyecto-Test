(() => {
  function renderSessionHint() {
    const session = window.APP.getSession();
    const user = window.APP.getCurrentUser();

    const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'user' ? 'Usuario' : 'Invitado';
    const target = document.querySelector('[data-landing-session]');

    if (!target) return;

    if (session.accessToken) {
      target.innerHTML = `
        <span class="badge success">Sesion activa</span>
        <div class="stack" style="gap:6px;">
          <strong>${window.APP.escapeHtml(user?.username || 'Usuario')}</strong>
          <span class="helper">${window.APP.escapeHtml(roleLabel)} listo para abrir el dashboard.</span>
        </div>
      `;
    } else {
      target.innerHTML = `
        <span class="badge accent">Acceso rapido</span>
        <div class="stack" style="gap:6px;">
          <strong>Prueba la app en segundos</strong>
          <span class="helper">Crea una cuenta o inicia sesion para entrar al dashboard con tareas, reportes y usuarios.</span>
        </div>
      `;
    }
  }

  function bindLandingActions() {
    const dashboardButtons = document.querySelectorAll('[data-go-dashboard]');
    const loginButtons = document.querySelectorAll('[data-go-login]');
    const registerButtons = document.querySelectorAll('[data-go-register]');

    dashboardButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = window.APP.getSession().accessToken ? '/app.html#overview' : '/login.html';
        window.location.href = target;
      });
    });

    loginButtons.forEach((button) => button.addEventListener('click', () => {
      window.location.href = '/login.html';
    }));

    registerButtons.forEach((button) => button.addEventListener('click', () => {
      window.location.href = '/register.html';
    }));
  }

  function highlightFeatureCards() {
    const cards = document.querySelectorAll('[data-feature-card]');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 80}ms`;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderSessionHint();
    bindLandingActions();
    highlightFeatureCards();
  });
})();
