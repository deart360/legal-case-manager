import { AuthService } from '../services/auth.js';

export function createLoginView() {
    const container = document.createElement('div');
    container.className = 'login-view h-full flex items-center justify-center p-4';

    // Inline styles for login view specific layout (can move to CSS later)
    container.style.minHeight = '100vh';
    container.style.background = 'radial-gradient(circle at center, #1f2937 0%, #000000 100%)';

    const loginHtml = `
        <div class="glass-card p-8 animate-scale-in" style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 2rem;">
            <div class="text-center">
                <div class="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-glass border border-glass shadow-lg">
                    <i class="ph-fill ph-gavel text-3xl text-accent"></i>
                </div>
                <h1 class="h2 mb-2">Decrevi Advocatus</h1>
                <p class="text-muted text-sm">Sistema de Gestión Legal</p>
            </div>

            <form id="login-form" class="flex flex-col gap-4">
                <div class="form-group">
                    <label class="text-xs text-muted uppercase font-bold mb-1">Usuario</label>
                    <div class="relative">
                        <i class="ph-fill ph-user absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"></i>
                        <input type="text" id="username" class="form-input pl-10" placeholder="Ingresa tu usuario" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="text-xs text-muted uppercase font-bold mb-1">Contraseña</label>
                    <div class="relative">
                        <i class="ph-fill ph-lock-key absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"></i>
                        <input type="password" id="password" class="form-input pl-10" placeholder="••••••••" required>
                    </div>
                </div>

                <div class="flex items-center gap-2 text-sm text-muted mt-2">
                    <input type="checkbox" id="keep-signed-in" checked class="accent-accent">
                    <label for="keep-signed-in">Mantener sesión iniciada</label>
                </div>

                <button type="submit" class="btn-primary w-full mt-4 py-3 text-lg shadow-lg hover:shadow-accent/20">
                    Iniciar Sesión
                </button>
            </form>
            
            <div id="login-error" class="text-danger text-sm text-center hidden bg-red-900/20 p-2 rounded border border-red-500/30"></div>

            <div class="text-center text-xs text-muted opacity-50 mt-4">
                v1.0 • Acceso Restringido
            </div>
        </div>
    `;

    container.innerHTML = loginHtml;

    // Bind Events
    const form = container.querySelector('#login-form');
    const errorMsg = container.querySelector('#login-error');

    form.onsubmit = (e) => {
        e.preventDefault();
        const username = form.username.value.trim();
        const password = form.password.value.trim();

        const result = AuthService.login(username, password);

        if (result.success) {
            // Redirect to dashboard
            window.location.hash = '#dashboard';
            // Force reload to apply layout changes (sidebar, etc) if needed, 
            // but router should handle it. Ideally we reload to ensure clean state.
            window.location.reload();
        } else {
            errorMsg.textContent = result.message;
            errorMsg.classList.remove('hidden');
            // Shake animation
            const card = container.querySelector('.glass-card');
            card.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(0)' }
            ], { duration: 300 });
        }
    };

    return container;
}
