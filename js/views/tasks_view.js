import { getAllEvents, updateTask, deleteTask, getCase } from '../store.js';

let currentFilter = 'pending'; // 'pending' | 'completed'

export function createTasksView() {
    const container = document.createElement('div');
    container.className = 'tasks-view p-6';

    renderTasksView(container);

    // Listen for updates
    window.addEventListener('case-updated', () => {
        renderTasksView(container);
    });

    return container;
}

function renderTasksView(container) {
    const events = getAllEvents().filter(e => e.type === 'task');

    // Filter logic
    const filteredEvents = events.filter(e => {
        if (currentFilter === 'pending') return !e.completed;
        if (currentFilter === 'completed') return e.completed;
        return true;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    container.innerHTML = `
        <div class="tasks-header">
            <div>
                <h1 class="h2">Gestor de Tareas</h1>
                <p class="text-muted">Administra tus pendientes y términos</p>
            </div>
            <div class="tasks-filters">
                <button class="filter-btn ${currentFilter === 'pending' ? 'active' : ''}" id="filter-pending">Pendientes</button>
                <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" id="filter-completed">Completadas</button>
            </div>
        </div>

        <div class="tasks-container custom-scrollbar">
            ${filteredEvents.length === 0 ?
            `<div class="text-center text-muted p-8">No hay tareas ${currentFilter === 'pending' ? 'pendientes' : 'completadas'}.</div>` :
            filteredEvents.map(task => createTaskCard(task)).join('')}
        </div>
        
        <!-- Edit Modal -->
        <div id="edit-task-modal" class="modal hidden">
            <div class="modal-content glass-card p-6 w-full max-w-md animate-scale-in">
                <div class="modal-header mb-4 flex justify-between items-center">
                    <h3 class="h3">Editar Tarea</h3>
                    <button class="btn-icon-sm" id="close-edit-modal"><i class="ph ph-x"></i></button>
                </div>
                <form id="edit-task-form" class="modal-form">
                    <input type="hidden" id="edit-task-id">
                    <input type="hidden" id="edit-case-id">
                    
                    <div class="form-group">
                        <label class="text-xs text-muted uppercase font-bold">Título</label>
                        <input type="text" id="edit-title" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="text-xs text-muted uppercase font-bold">Fecha</label>
                        <input type="date" id="edit-date" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="edit-urgent" class="w-4 h-4 accent-accent">
                            <span class="text-sm">Marcar como Urgente</span>
                        </label>
                    </div>
                    
                    <div class="flex gap-2 mt-4">
                        <button type="button" class="btn-secondary w-full" id="cancel-edit">Cancelar</button>
                        <button type="submit" class="btn-primary w-full">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    bindEvents(container);
}

function createTaskCard(task) {
    const isOverdue = !task.completed && new Date(task.date) < new Date().setHours(0, 0, 0, 0);
    const dateStr = new Date(task.date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

    return `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}" data-case="${task.caseId}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="window.toggleTask('${task.caseId}', '${task.id}', ${!task.completed})">
                ${task.completed ? '<i class="ph-bold ph-check text-xs"></i>' : ''}
            </div>
            
            <div class="task-info">
                <div class="flex justify-between items-start">
                    <span class="task-title font-medium ${task.completed ? 'line-through text-muted' : 'text-white'}">${task.title}</span>
                    ${task.urgent ? '<span class="task-tag urgent text-xs">URGENTE</span>' : ''}
                </div>
                <div class="task-meta">
                    <span class="${isOverdue ? 'text-red-400 font-bold' : ''}"><i class="ph ph-calendar-blank"></i> ${dateStr}</span>
                    <!-- <span><i class="ph ph-folder"></i> ${task.caseId}</span> --> 
                </div>
            </div>
            
            <div class="task-actions">
                <button class="btn-icon-sm" onclick="window.openEditTask('${task.caseId}', '${task.id}')" title="Editar">
                    <i class="ph ph-pencil-simple"></i>
                </button>
                <button class="btn-icon-sm hover:bg-red-500/20 hover:text-red-400" onclick="window.deleteTaskAction('${task.caseId}', '${task.id}')" title="Eliminar">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function bindEvents(container) {
    // Filter Buttons
    container.querySelector('#filter-pending').onclick = () => {
        currentFilter = 'pending';
        renderTasksView(container);
    };

    container.querySelector('#filter-completed').onclick = () => {
        currentFilter = 'completed';
        renderTasksView(container);
    };

    // Modal Logic
    const modal = container.querySelector('#edit-task-modal');
    const form = container.querySelector('#edit-task-form');
    const closeBtn = container.querySelector('#close-edit-modal');
    const cancelBtn = container.querySelector('#cancel-edit');

    const closeModal = () => modal.classList.add('hidden');

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    }

    // Form Submit
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const taskId = document.getElementById('edit-task-id').value;
            const caseId = document.getElementById('edit-case-id').value;

            const updates = {
                title: document.getElementById('edit-title').value,
                date: document.getElementById('edit-date').value,
                urgent: document.getElementById('edit-urgent').checked
            };

            await updateTask(caseId, taskId, updates);
            closeModal();
            renderTasksView(container);
        };
    }

    // Global Actions (exposed to window for inline onclicks)
    window.toggleTask = async (caseId, taskId, completed) => {
        await updateTask(caseId, taskId, { completed });
        renderTasksView(container);
    };

    window.deleteTaskAction = async (caseId, taskId) => {
        if (confirm('¿Estás seguro de eliminar esta tarea?')) {
            await deleteTask(caseId, taskId);
            renderTasksView(container);
        }
    };

    window.openEditTask = (caseId, taskId) => {
        const events = getAllEvents();
        const task = events.find(t => t.id === taskId && t.caseId === caseId);
        if (!task) return;

        document.getElementById('edit-task-id').value = taskId;
        document.getElementById('edit-case-id').value = caseId;
        document.getElementById('edit-title').value = task.title.split('(')[0].trim(); // Remove appended info
        document.getElementById('edit-date').value = task.date;
        document.getElementById('edit-urgent').checked = task.urgent;

        modal.classList.remove('hidden');
    };
}
