(() => {
  function bindLogin() {
    const form = document.getElementById('loginForm');
    const message = document.getElementById('authMessage');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.className = 'message';
      message.textContent = 'Validando credenciales...';

      try {
        const response = await window.APP.apiFetch('/api/auth/login', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({
            username: form.username.value.trim(),
            password: form.password.value
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'No fue posible iniciar sesion');
        }

        window.APP.setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          role: data.role
        });

        window.APP.notify('Sesion iniciada correctamente.', 'success', { title: 'Bienvenido' });
        window.location.href = '/app.html#overview';
      } catch (error) {
        message.className = 'message is-error';
        message.textContent = error.message || 'Error al iniciar sesion';
      }
    });
  }

  function bindRegister() {
    const form = document.getElementById('registerForm');
    const message = document.getElementById('authMessage');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.className = 'message';
      message.textContent = 'Creando usuario...';

      try {
        const response = await window.APP.apiFetch('/api/auth/register', {
          method: 'POST',
          auth: false,
          body: JSON.stringify({
            username: form.username.value.trim(),
            password: form.password.value,
            role: form.role.value
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'No fue posible registrar el usuario');
        }

        message.className = 'message is-success';
        message.textContent = 'Registro completado. Redirigiendo a login...';
        window.APP.notify('Usuario registrado. Ya puedes iniciar sesion.', 'success', { title: 'Registro completado' });
        window.setTimeout(() => {
          window.location.href = '/login.html';
        }, 1100);
      } catch (error) {
        message.className = 'message is-error';
        message.textContent = error.message || 'Error en el registro';
      }
    });
  }

  function redirectIfAuthenticated() {
    if (window.APP.getSession().accessToken) {
      window.location.href = '/app.html#overview';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    redirectIfAuthenticated();
    bindLogin();
    bindRegister();
  });
})();
