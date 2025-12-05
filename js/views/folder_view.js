import { getState, getSubject, getCase } from '../store.js';

export function createFolderView(folderId) {
    const container = document.createElement('div');
    container.className = 'folder-view p-6';

    // Determine if it's a State or a Subject
    let folderType = 'unknown';
    let data = getState(folderId);

    if (data) {
        folderType = 'state';
    } else {
        data = getSubject(folderId);
        if (data) folderType = 'subject';
    }

    if (!data) {
        container.innerHTML = `<h2>Carpeta no encontrada</h2>`;
        return container;
    }

    const header = `
        <div class="folder-header mb-6">
            <h1 class="h2"><i class="ph ph-folder-open text-accent"></i> ${data.name}</h1>
            <p class="text-muted">${folderType === 'state' ? 'Selecciona una materia' : 'Expedientes disponibles'}</p>
        </div>
    `;

    let contentHtml = '';

    if (folderType === 'state') {
        // Show Subjects as Cards
        contentHtml = `
            <div class="grid-folders">
                ${data.subjects.map(sub => `
                    <div class="folder-card" onclick="window.navigateTo('#folder/${sub.id}')">
                        <i class="ph-fill ph-gavel icon"></i>
                        <span class="name">${sub.name}</span>
                        <span class="count text-muted">${sub.cases.length} Asuntos</span>
                    </div>
                `).join('')}
                <!-- Add Subject Button -->
                <div class="folder-card new-folder" onclick="window.promptAddSubject('${data.id}')">
                    <i class="ph ph-plus icon"></i>
                    <span class="name">Nueva Materia</span>
                </div>
            </div>
        `;
    } else if (folderType === 'subject') {
        const addCaseBtn = `
            <button class="btn-primary mb-4" onclick="window.promptAddCase('${data.id}')">
                <i class="ph ph-plus"></i> Nuevo Expediente
            </button>
        `;

        // Show Cases as List
        if (data.cases.length === 0) {
            contentHtml = `
                ${addCaseBtn}
                <div class="empty-state">No hay expedientes en esta carpeta.</div>
            `;
        } else {
            contentHtml = `
                ${addCaseBtn}
                <div class="case-list">
                    ${data.cases.map(caseId => {
                const c = getCase(caseId);
                return `
                            <div class="case-item card" onclick="window.navigateTo('#case/${caseId}')">
                                <div class="case-icon"><i class="ph ph-file-text"></i></div>
                                <div class="case-details">
                                    <div class="case-title">${c.title}</div>
                                    <div class="case-meta">
                                        <span class="badge">${c.expediente}</span>
                                        <span>${c.juzgado}</span>
                                        <span class="status ${c.status.toLowerCase()}">${c.status}</span>
                                    </div>
                                </div>
                                <div class="case-arrow"><i class="ph ph-caret-right"></i></div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }
    }

    container.innerHTML = header + contentHtml;

    return container;

    return container;
}
