import { appData } from '../store.js';

export function renderSidebar() {
    const sidebar = document.getElementById('sidebar');

    const html = `
        <div class="sidebar-header">
            <div class="logo-area">
                <img src="assets/logo.jpg" alt="Logo" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--accent); object-fit: cover;">
                <span class="app-title" style="color: var(--accent); text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);">Decrevi Advocatus</span>
            </div>
            <button id="sidebar-collapse" class="btn-icon-sm" style="margin-left: auto; color: var(--text-muted);">
                <i class="ph ph-arrows-in-line-horizontal"></i>
            </button>
        </div>
        
        <nav class="sidebar-nav">
            <a href="#dashboard" class="nav-item active">
                <i class="ph ph-squares-four"></i>
                <span>Dashboard</span>
            </a>
            
            <div class="nav-section-title">EXPEDIENTES</div>
            
            ${appData.states.map(state => `
                <div class="state-group">
                    <div class="nav-item state-header" onclick="this.classList.toggle('expanded')">
                        <i class="ph ph-map-pin"></i>
                        <span>${state.name}</span>
                        <i class="ph ph-caret-down chevron"></i>
                    </div>
                    <div class="state-children">
                        ${state.subjects.map(subject => `
                            <div class="subject-group">
                                <div class="nav-item subject-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                                    <i class="ph ph-folder-open"></i>
                                    <span>${subject.name}</span>
                                </div>
                                <div class="subject-children hidden">
                                    ${subject.cases.map(caseId => {
        const caseData = appData.cases[caseId];
        return caseData ? `
                                            <a href="#case/${caseId}" class="nav-item case-link">
                                                <i class="ph ph-file-text"></i>
                                                <span>${caseData.expediente}</span>
                                            </a>
                                        ` : '';
    }).join('')}
                                     <div class="nav-item add-case" onclick="window.openCaseModal('${subject.id}')">
                                        <i class="ph ph-plus-circle"></i>
                                        <span>Nuevo Asunto</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </nav>
        
        <div class="sidebar-footer">
            <div class="user-profile">
                <div class="avatar">DA</div>
                <div class="user-info">
                    <span class="name">Diego Amador</span>
                    <span class="role">Abogado</span>
                </div>
                <div id="firebase-status-indicator" class="status-indicator-sidebar" title="Estado de conexión"></div>
            </div>
        </div>
    `;

    sidebar.innerHTML = html;

    // Sidebar Collapse Logic
    const collapseBtn = sidebar.querySelector('#sidebar-collapse');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            sidebar.classList.toggle('collapsed');
            const icon = collapseBtn.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                icon.classList.replace('ph-arrows-in-line-horizontal', 'ph-arrows-out-line-horizontal');
            } else {
                icon.classList.replace('ph-arrows-out-line-horizontal', 'ph-arrows-in-line-horizontal');
            }
        };
    }

    // Check connection status after rendering
    import('../firebase_config.js').then(fb => {
        if (fb.checkConnection) fb.checkConnection();
    });
}
