import { appData } from '../store.js';
import { AuthService } from '../services/auth.js';

export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const user = AuthService.getCurrentUser();

    if (!user) return; // Should be handled by router, but safety check

    const sidebarHtml = `
        <div class="sidebar-header">
            <div class="logo-area" onclick="document.getElementById('sidebar').classList.toggle('collapsed')">
                <img src="assets/logo.jpg" alt="Logo" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--accent);">
                <span class="app-title">Decrevi</span>
            </div>
            <button id="sidebar-collapse" class="btn-icon-sm ml-auto text-muted hover:text-white">
                <i class="ph ph-caret-left chevron"></i>
            </button>
        </div>

        <nav class="sidebar-nav custom-scrollbar">
            <div class="nav-item active" onclick="window.navigateTo('#dashboard')">
                <i class="ph ph-squares-four"></i>
                <span>Dashboard</span>
            </div>
            
            <div class="nav-item" onclick="window.navigateTo('#calendar')">
                <i class="ph ph-calendar"></i>
                <span>Calendario</span>
            </div>

            <div class="nav-section-title">Expedientes</div>
            
            <!-- State Folders (Hardcoded for MVP) -->
            <div class="state-group">
                <div class="nav-item state-header" onclick="this.classList.toggle('expanded')">
                    <i class="ph ph-map-pin"></i>
                    <span>Ciudad de México</span>
                    <i class="ph ph-caret-down chevron"></i>
                </div>
                <div class="state-children">
                    <div class="nav-item" onclick="window.navigateTo('#folder/cdmx-fam')">
                        <span>Familiar</span>
                    </div>
                    <div class="nav-item" onclick="window.navigateTo('#folder/cdmx-civ')">
                        <span>Civil</span>
                    </div>
                </div>
            </div>

            <div class="state-group">
                <div class="nav-item state-header" onclick="this.classList.toggle('expanded')">
                    <i class="ph ph-map-pin"></i>
                    <span>Estado de México</span>
                    <i class="ph ph-caret-down chevron"></i>
                </div>
                <div class="state-children">
                    <div class="nav-item" onclick="window.navigateTo('#folder/edomex-fam')">
                        <span>Familiar</span>
                    </div>
                </div>
            </div>

             <div class="state-group">
                <div class="nav-item state-header" onclick="this.classList.toggle('expanded')">
                    <i class="ph ph-map-pin"></i>
                    <span>Querétaro</span>
                    <i class="ph ph-caret-down chevron"></i>
                </div>
                <div class="state-children">
                    <div class="nav-item" onclick="window.navigateTo('#folder/qro-fam')">
                        <span>Familiar</span>
                    </div>
                </div>
            </div>

        </nav>

        <div class="sidebar-footer">
            <div class="user-profile">
                <div class="avatar">${user.initials}</div>
                <div class="user-info">
                    <span class="name">${user.name}</span>
                    <span class="text-xs text-muted capitalize">${user.role === 'admin' ? 'Administrador' : 'Abogado'}</span>
                </div>
                <div class="status-indicator-sidebar connected" title="Conectado"></div>
                <button class="btn-icon-sm ml-2 text-info" onclick="import('../utils/seed_data.js').then(m => m.seedScheduleData())" title="IMPORTAR DATOS INICIALES">
                    <i class="ph ph-cloud-arrow-up"></i>
                </button>
                <button class="btn-icon-sm ml-2 text-danger" id="btn-logout" title="Cerrar Sesión">
                    <i class="ph ph-sign-out"></i>
                </button>
            </div>
        </div>
    `;

    sidebar.innerHTML = sidebarHtml;

    // Collapse Logic
    const collapseBtn = document.getElementById('sidebar-collapse');
    if (collapseBtn) {
        collapseBtn.onclick = (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('collapsed');
        };
    }

    // Logout Logic
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('¿Cerrar sesión?')) {
                AuthService.logout();
            }
        };
    }
}
