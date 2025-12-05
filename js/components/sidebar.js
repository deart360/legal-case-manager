import { appData } from '../store.js';

export function renderSidebar() {
    const sidebar = document.getElementById('sidebar');

    const html = `
        <div class="sidebar-header">
            <div class="logo-area">
                <i class="ph ph-scales" style="font-size: 24px; color: var(--accent);"></i>
                <span class="app-title">Decrevi Advocatus</span>
            </div>
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
                                     <div class="nav-item add-case" onclick="window.promptAddCase('${subject.id}')">
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
                    <span class="name">Diego Amador</span>
                    <span class="role">Abogado Titular</span>
                </div>
                <div id="firebase-status-indicator" class="status-indicator-sidebar" title="Estado de conexión"></div>
            </div>
        </div>
    `;

    sidebar.innerHTML = html;
}
