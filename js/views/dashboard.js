import { appData, getAllEvents } from '../store.js';
import { AuthService } from '../services/auth.js';

let currentDate = new Date();
let timelineMode = 'today'; // 'today' or 'upcoming'

export function createDashboardView() {
    const container = document.createElement('div');
    container.className = 'dashboard-view p-6';
    console.log('Dashboard View Loaded - v3-Column-Layout');
    // alert('Dashboard Updated: 3 Columns'); // Temporary debug

    // Initial Render
    renderFullDashboard(container);

    return container;
}

function renderFullDashboard(container) {
    const events = getAllEvents();
    const user = AuthService.getCurrentUser();
    const firstName = user ? user.name.split(' ')[0] : 'Usuario';

    const header = `
        <div class="dash-header mb-6">
            <div>
                <h1 class="h2">Hola, ${firstName}</h1>
                <p class="text-muted">Resumen de actividad y términos</p>
            </div>
            <div class="date-display">
                <span class="text-sm font-medium">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
        </div>
    `;
    // const { AuthService } = require('../services/auth.js'); // Dynamic import workaround or assume global if bundled, but better to import at top. 
    // Actually, we can't require inside function in standard ES modules without bundler. 
    // We should import at top.

    // Let's fix the import first.


    const dashboardHtml = `
        <div class="dash-grid">
            <!-- Column 1: Agenda (Timeline) -->
            <div class="dash-col col-agenda">

                <div class="card timeline-card h-full flex flex-col">
                    <div class="card-header">
                        <h3 class="h3">Agenda</h3>
                        <div class="segmented-control">
                            <button class="segment-btn ${timelineMode === 'today' ? 'active' : ''}" id="btn-today">Hoy</button>
                            <button class="segment-btn ${timelineMode === 'upcoming' ? 'active' : ''}" id="btn-upcoming">Semanal</button>
                        </div>
                    </div>
                    <div class="timeline-list flex-1 overflow-y-auto" id="timeline-container">
                        <!-- Content rendered by JS -->
                    </div>
                </div>
            </div>

            <!-- Column 2: Términos (Urgent Terms) -->
            <div class="dash-col col-terms">
                <div class="card urgent-widget h-full flex flex-col">
                    <div class="card-header">
                        <h3 class="h3 text-danger"><i class="ph-fill ph-warning-circle"></i> Términos</h3>
                    </div>
                    <div class="urgent-list flex-1 overflow-y-auto" id="urgent-terms-list">
                         <!-- Dynamic Content -->
                    </div>
                </div>
            </div>

            <!-- Column 3: Misc (Quick Task + Report) -->
            <div class="dash-col col-misc flex flex-col gap-4">
                
                <!-- Quick Add Task Widget -->
                <div class="card quick-task-card quick-task-widget">
                    <div class="card-header flex justify-between items-center">
                        <h3 class="h3"><i class="ph-fill ph-plus-circle text-accent"></i> Tarea Rápida</h3>
                        <button class="btn-text-sm" onclick="window.navigateTo('#tasks')">
                            <i class="ph ph-list-checks"></i> Ver Todas
                        </button>
                    </div>
                    <form id="quick-task-form" class="quick-task-form">
                        <div class="form-group">
                            <label class="text-xs text-muted uppercase font-bold">Ubicación</label>
                            <select id="qt-state" class="form-input text-sm">
                                <option value="">Selecciona Estado...</option>
                                ${appData.states.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="text-xs text-muted uppercase font-bold">Materia</label>
                            <select id="qt-subject" class="form-input text-sm" disabled>
                                <option value="">Selecciona Materia...</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="text-xs text-muted uppercase font-bold">Expediente</label>
                            <select id="qt-case" class="form-input text-sm" disabled>
                                <option value="">Selecciona Expediente...</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="text-xs text-muted uppercase font-bold">Tipo de Pendiente</label>
                            <select id="qt-type" class="form-input text-sm">
                                <option value="pendiente">Pendiente General</option>
                                <option value="termino">Término (Urgente)</option>
                                <option value="revision">Revisión</option>
                                <option value="turnar">Turnar</option>
                            </select>
                        </div>

                        <div class="form-group relative">
                            <label class="text-xs text-muted uppercase font-bold flex justify-between">
                                Descripción
                                <button type="button" id="btn-ai-task" class="text-accent hover:text-white transition-colors text-xs flex items-center gap-1">
                                    <i class="ph-fill ph-magic-wand"></i> Autocompletar con IA
                                </button>
                            </label>
                            <textarea id="qt-desc" class="form-input text-sm" rows="2" placeholder="Ej: 'Revisar expediente mercantil mañana urgente'"></textarea>
                        </div>

                        <div class="form-group">
                            <label class="text-xs text-muted uppercase font-bold">Fecha Vencimiento</label>
                            <input type="date" id="qt-date" class="form-input text-sm" required>
                        </div>

                        <button type="submit" class="btn-primary w-full mt-2">
                            <i class="ph ph-check"></i> Agregar Tarea
                        </button>
                    </form>
                </div>

                <!-- Promotions Widget (NEW) -->
                <div class="card promotions-widget flex flex-col h-full" style="min-height: 300px;">
                    <div class="card-header flex justify-between items-center shrink-0 cursor-pointer" onclick="window.location.hash='#promotions'">
                        <h3 class="h3"><i class="ph-fill ph-files text-accent"></i> Promociones</h3>
                         <button type="button" class="btn-primary small" onclick="event.stopPropagation(); document.getElementById('promo-input-dash').click()">
                            <i class="ph ph-camera"></i> Capturar
                        </button>
                    </div>
                    <input type="file" id="promo-input-dash" accept="image/*" class="hidden" onclick="event.stopPropagation()">
                    <div id="promotions-list" class="promo-list flex-1 overflow-y-auto mt-2">
                        <!-- Dynamic List Content -->
                    </div>
                </div>

                <!-- AI Weekly Report -->
                <div class="card ai-report-card">
                    <div class="card-header">
                        <h3 class="h3"><i class="ph-fill ph-sparkle text-accent"></i> Reporte Semanal AI</h3>
                    </div>
                    <div class="report-summary-content">
                        <p class="text-sm text-muted mb-4">
                            Resumen de actividad reciente y predicciones.
                        </p>
                        <div class="flex flex-col gap-2">
                            <button class="btn-primary w-full" id="btn-my-report">
                                <i class="ph ph-user"></i> Mi Reporte
                            </button>
                            ${user && user.role === 'admin' ? `
                            <button class="btn-secondary w-full" id="btn-general-report">
                                <i class="ph ph-users"></i> Reporte General (Admin)
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Infographic Modal -->
        <div id="infographic-modal" class="modal hidden">
            <div class="infographic-container glass-card document-style">
                <div class="modal-header">
                    <div class="header-content">
                        <span class="sub-label">REPORTE DE RENDIMIENTO LEGAL Y OPERATIVO</span>
                        <h2 class="doc-title">ANÁLISIS DE EFICIENCIA SEMANAL</h2>
                        <div class="doc-meta">
                            <span>Semana 48 • Diciembre 2025</span>
                            <span class="badge-success">OBJETIVOS CUMPLIDOS</span>
                        </div>
                    </div>
                    <button class="btn-icon-sm" id="close-infographic"><i class="ph ph-x"></i></button>
                </div>
                
                <div class="infographic-body scroll-y">
                    <div class="doc-grid">
                        <!-- Left Column: Detailed Activity Log -->
                        <div class="doc-main">
                            <section class="doc-section">
                                <h3 class="section-title">1. EXPEDIENTES ACTUALIZADOS (SEMANA EN CURSO)</h3>
                                <p class="doc-text mb-4">
                                    Resumen de los expedientes que han tenido actividad procesal reciente, incluyendo nuevos acuerdos, notificaciones y anexos fotográficos.
                                </p>
                                <div class="stat-table">
                                    <div class="table-row header">
                                        <span>Expediente / Juzgado</span>
                                        <span>Actuación</span>
                                        <span>Fecha</span>
                                    </div>
                                    <div class="table-row">
                                        <span><strong>Exp. 1234/2024</strong><br><small>Juzgado 12 Familiar</small></span>
                                        <span>Auto Admisorio. Se ordena emplazamiento y se señalan medidas provisionales.</span>
                                        <span>01/Dic</span>
                                    </div>
                                    <div class="table-row">
                                        <span><strong>Exp. 888/2023</strong><br><small>Juzgado 5 Civil</small></span>
                                        <span>Sentencia Interlocutoria. Resuelve incidente de nulidad de actuaciones.</span>
                                        <span>03/Dic</span>
                                    </div>
                                    <div class="table-row">
                                        <span><strong>Exp. 555/2024</strong><br><small>Juzgado 1 Civil</small></span>
                                        <span>Diligencia de Emplazamiento. Se corre traslado a la parte demandada.</span>
                                        <span>04/Dic</span>
                                    </div>
                                </div>
                            </section>

                            <section class="doc-section">
                                <h3 class="section-title">2. TÉRMINOS Y TAREAS PENDIENTES</h3>
                                <div class="alert-box warning">
                                    <h4 class="alert-title">VENCIMIENTOS PRÓXIMOS</h4>
                                    <div class="term-detail-list">
                                        <div class="term-row">
                                            <span class="term-date text-danger">Vence: 06/Dic</span>
                                            <div class="term-content">
                                                <strong>Contestación de Demanda (Exp. 1234/2024)</strong>
                                                <p>Se debe negar hechos propios y oponer excepciones. Pendiente revisión con cliente.</p>
                                            </div>
                                        </div>
                                        <div class="term-row">
                                            <span class="term-date text-warning">Vence: 08/Dic</span>
                                            <div class="term-content">
                                                <strong>Desahogo de Vista (Exp. 888/2023)</strong>
                                                <p>Manifestar lo que a derecho convenga sobre la planilla de liquidación.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            
                            <section class="doc-section">
                                <h3 class="section-title">3. OBSERVACIONES GENERALES</h3>
                                <p class="doc-text highlight-text">
                                    **Nota:** Se requiere especial atención en el desahogo de pruebas del Exp. 1234/2024. 
                                    Asegurar la preparación de testigos para la audiencia de la próxima semana.
                                </p>
                            </section>
                        </div>

                        <!-- Right Column: Summary Metrics -->
                        <div class="doc-sidebar">
                            
                            <!-- Summary Card -->
                            <div class="chart-card">
                                <h4>RESUMEN DE ACTIVIDAD</h4>
                                <div class="info-grid-mini">
                                    <div class="mini-stat">
                                        <span class="num">5</span>
                                        <span class="lbl">Expedientes Vistos</span>
                                    </div>
                                    <div class="mini-stat">
                                        <span class="num">3</span>
                                        <span class="lbl">Expedientes Revisados</span>
                                    </div>
                                    <div class="mini-stat text-danger">
                                        <span class="num">2</span>
                                        <span class="lbl">Términos Fatales</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Chart: Activity by Type -->
                            <div class="chart-card">
                                <h4>TIPO DE ACTUACIONES</h4>
                                <div class="bar-chart-vertical">
                                    <div class="v-bar-group">
                                        <div class="v-bar" style="height: 60%"></div>
                                        <span>Acuerdos</span>
                                    </div>
                                    <div class="v-bar-group">
                                        <div class="v-bar" style="height: 30%"></div>
                                        <span>Audien.</span>
                                    </div>
                                    <div class="v-bar-group">
                                        <div class="v-bar" style="height: 80%"></div>
                                        <span>Promoc.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Status Box -->
                            <div class="status-box">
                                <h4>ESTADO PROCESAL</h4>
                                <div class="check-item">
                                    <i class="ph-fill ph-clock"></i>
                                    <span>2 En Término</span>
                                </div>
                                <div class="check-item">
                                    <i class="ph-fill ph-check-circle"></i>
                                    <span>3 Al Corriente</span>
                                </div>
                                <div class="check-item">
                                    <i class="ph-fill ph-warning"></i>
                                    <span>1 Requiere Impulso</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Terms Modal -->
        <div id="terms-modal" class="modal hidden">
            <div class="modal-content glass-card p-6 animate-scale-in" style="max-width: 600px; width: 95%; max-height: 85vh; display: flex; flex-direction: column;">
                <div class="modal-header mb-4 flex justify-between items-center border-b border-glass pb-4">
                    <div>
                        <h3 class="h3 text-danger"><i class="ph-fill ph-warning-circle"></i> Términos y Vencimientos</h3>
                        <p class="text-sm text-muted">Lista completa de términos judiciales</p>
                    </div>
                    <button class="btn-icon-sm" id="close-terms-modal"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body flex-1 overflow-y-auto custom-scrollbar" id="modal-terms-list">
                    <!-- Dynamic Content -->
                </div>
            </div>
        </div>
    `;

    container.innerHTML = header + dashboardHtml;

    // Render Sub-components
    updateTimeline(container, events);
    // updateCalendar(container, events); // Removed
    updateUrgentTerms(container, events);

    // Bind Events
    bindDashboardEvents(container, events);
    bindQuickTaskEvents(container);

    // Bind Terms Modal Events
    const termsHeader = container.querySelector('.urgent-widget .card-header');
    const termsModal = container.querySelector('#terms-modal');
    const closeTermsBtn = container.querySelector('#close-terms-modal');

    if (termsHeader && termsModal) {
        termsHeader.style.cursor = 'pointer';
        termsHeader.title = 'Clic para expandir';
        termsHeader.onclick = () => {
            termsModal.classList.remove('hidden');
        };

        if (closeTermsBtn) {
            closeTermsBtn.onclick = () => termsModal.classList.add('hidden');
        }

        termsModal.onclick = (e) => {
            if (e.target === termsModal) termsModal.classList.add('hidden');
        };
    }
}

function bindQuickTaskEvents(container) {
    const stateSelect = container.querySelector('#qt-state');
    const subjectSelect = container.querySelector('#qt-subject');
    const caseSelect = container.querySelector('#qt-case');
    const form = container.querySelector('#quick-task-form');

    // State Change -> Load Subjects
    stateSelect.onchange = () => {
        const stateId = stateSelect.value;
        subjectSelect.innerHTML = '<option value="">Selecciona Materia...</option>';
        caseSelect.innerHTML = '<option value="">Selecciona Expediente...</option>';
        subjectSelect.disabled = true;
        caseSelect.disabled = true;

        if (stateId) {
            const state = appData.states.find(s => s.id === stateId);
            if (state) {
                subjectSelect.innerHTML += state.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                subjectSelect.disabled = false;
            }
        }
    };

    // Subject Change -> Load Cases
    subjectSelect.onchange = () => {
        const subjectId = subjectSelect.value;
        caseSelect.innerHTML = '<option value="">Selecciona Expediente...</option>';
        caseSelect.disabled = true;

        if (subjectId) {
            // Find subject across states (though we know the state, this is safer)
            for (const state of appData.states) {
                const subject = state.subjects.find(s => s.id === subjectId);
                if (subject) {
                    const cases = subject.cases.map(cId => appData.cases[cId]).filter(c => c);
                    caseSelect.innerHTML += cases.map(c => `<option value="${c.id}">${c.expediente} - ${c.title}</option>`).join('');
                    caseSelect.disabled = false;
                    break;
                }
            }
        }
    };

    // Form Submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        const caseId = caseSelect.value;
        const type = container.querySelector('#qt-type').value;
        const date = container.querySelector('#qt-date').value;
        const desc = container.querySelector('#qt-desc').value;

        if (!caseId || !date) {
            alert('Por favor selecciona un expediente y una fecha.');
            return;
        }

        let title = '';
        // Customize title based on type
        if (type === 'termino') title = 'VENCIMIENTO DE TÉRMINO';
        else if (type === 'revision') title = 'Revisión de Acuerdos';
        else if (type === 'turnar') title = 'Turnar';
        else title = 'Pendiente General';

        // Append description if provided
        if (desc) {
            title += `: ${desc}`;
        }

        const taskData = {
            title: title,
            date: date,
            urgent: type === 'termino'
        };

        const { addTask } = await import('../store.js');
        await addTask(caseId, taskData);

        alert('Tarea agregada correctamente.');
        form.reset();
        // Reset dropdowns
        subjectSelect.innerHTML = '<option value="">Selecciona Materia...</option>';
        caseSelect.innerHTML = '<option value="">Selecciona Expediente...</option>';
        subjectSelect.disabled = true;
        caseSelect.disabled = true;

        // Refresh dashboard
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
}

function updateUrgentTerms(container, events) {
    const listContainer = container.querySelector('#urgent-terms-list');
    const modalListContainer = container.querySelector('#modal-terms-list'); // For the modal

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter for ALL urgent tasks or deadlines (not just weekly range for the modal/full view)
    // But for the widget, we might still want to limit, or just show top 5.
    // Let's get all future or recent past (overdue) terms.

    const urgentEvents = events.filter(e => {
        return (e.urgent || e.type === 'deadline');
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Render Widget (Top 5 or so)
    renderTermsList(listContainer, urgentEvents.slice(0, 10), false);

    // Render Modal (All)
    if (modalListContainer) {
        renderTermsList(modalListContainer, urgentEvents, true);
    }
}

function renderTermsList(container, events, isModal) {
    if (!container) return;

    if (events.length === 0) {
        container.innerHTML = '<div class="text-muted text-sm text-center">No hay términos pendientes.</div>';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = events.map(e => {
        const eDate = new Date(e.date + 'T00:00:00');
        const diffTime = eDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysLabel = 'días';
        let termClass = '';
        let daysDisplay = Math.abs(diffDays);

        // Color Coding Logic
        if (diffDays < 0) {
            // Overdue
            termClass = 'term-overdue';
            daysLabel = `VENCIDO (${daysDisplay} días)`;
        } else if (diffDays === 0) {
            // Today
            termClass = 'term-today';
            daysLabel = 'HOY';
            daysDisplay = 'HOY';
        } else if (diffDays === 1) {
            // 1 Day (Wine Red)
            termClass = 'term-1-day';
            daysLabel = 'día';
        } else if (diffDays === 2) {
            // 2 Days (Strong Orange)
            termClass = 'term-2-days';
        } else if (diffDays === 3) {
            // 3 Days (Yellow)
            termClass = 'term-3-days';
        } else {
            // Standard
            termClass = 'term-standard';
        }

        // Clean title for display
        const title = e.title.split('(')[0].trim();
        const sub = e.title.match(/\(([^)]+)\)/)?.[1] || 'Pendiente';

        let clickAction = '';
        if (e.caseId) {
            clickAction = `onclick="window.navigateTo('#case/${e.caseId}')"`;
        }

        return `
            <div class="term-item ${termClass}" ${clickAction} style="cursor: pointer;">
                <div class="term-info">
                    <span class="case-ref">${sub}</span>
                    <span class="term-desc">${title}</span>
                    <span class="text-xs opacity-80">${eDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div class="term-status">
                    <span class="days-count">${daysDisplay}</span>
                    <span class="days-label">${daysLabel}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateTimeline(container, events) {
    const listContainer = container.querySelector('#timeline-container');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filteredEvents = [];

    if (timelineMode === 'today') {
        filteredEvents = events.filter(e => {
            const eDate = new Date(e.date + 'T00:00:00');
            return eDate.toDateString() === today.toDateString();
        });
    } else {
        // Upcoming 7 days
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        filteredEvents = events.filter(e => {
            const eDate = new Date(e.date + 'T00:00:00');
            return eDate >= today && eDate <= nextWeek;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    if (filteredEvents.length === 0) {
        listContainer.innerHTML = `<div class="text-muted p-4 text-center">No hay eventos ${timelineMode === 'today' ? 'para hoy' : 'esta semana'}.</div>`;
        return;
    }

    // Group by Date
    const grouped = filteredEvents.reduce((acc, event) => {
        const date = event.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
    }, {});

    let html = '';

    Object.keys(grouped).forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        const isToday = dateObj.toDateString() === today.toDateString();

        // Only show header if in upcoming mode or if it's not today (though today mode only has today)
        // Actually, for "Weekly" view, headers are nice. For "Today", maybe not needed or just one.
        // Let's always show header for clarity in Weekly mode.

        if (timelineMode === 'upcoming') {
            html += `
                <div class="timeline-date-header">
                    <span class="date-label ${isToday ? 'text-accent' : ''}">${isToday ? 'Hoy - ' : ''}${dayName}</span>
                </div>
            `;
        }

        html += grouped[dateStr].map(task => {
            let clickAction = '';
            if (task.imgId) {
                clickAction = `onclick="window.openImage('${task.caseId}', '${task.imgId}')"`;
            } else if (task.caseId) {
                clickAction = `onclick="window.navigateTo('#case/${task.caseId}')"`;
            }

            return `
            <div class="timeline-item ${task.type}" ${clickAction} style="cursor: pointer;">
                <div class="time-marker"></div>
                <div class="task-content">
                    <div class="flex justify-between items-center">
                        <span class="task-time">${task.type === 'deadline' ? 'Vence hoy' : 'Pendiente'}</span>
                        ${task.urgent ? '<span class="tag urgent">Urgente</span>' : ''}
                    </div>
                    <span class="task-title">${task.title}</span>
                </div>
            </div>
            `;
        }).join('');
    });

    listContainer.innerHTML = html;
}

function bindDashboardEvents(container, events) {
    // Timeline Switch
    const btnToday = container.querySelector('#btn-today');
    const btnUpcoming = container.querySelector('#btn-upcoming');

    // AI Quick Task Listener
    const btnAiTask = container.querySelector('#btn-ai-task');
    const inputDesc = container.querySelector('#qt-desc');
    const inputDate = container.querySelector('#qt-date');
    const inputType = container.querySelector('#qt-type');

    if (btnAiTask && inputDesc) {
        btnAiTask.onclick = async (e) => {
            e.preventDefault();
            const text = inputDesc.value.trim();
            if (!text) {
                alert("Escribe algo en la descripción primero (ej. 'Audiencia mañana urgente').");
                return;
            }

            const originalIcon = btnAiTask.innerHTML;

            try {
                const { AIAnalysisService } = await import('../services/ai_service.js');
                const result = await AIAnalysisService.parseTaskIntent(text, (percent) => {
                    btnAiTask.innerHTML = `<i class="ph ph-spinner animate-spin"></i> ${percent}%`;
                });

                // Autofill
                if (result.description) inputDesc.value = result.description;
                if (result.date) inputDate.value = result.date;
                if (result.type) inputType.value = result.type;

                // Visual feedback
                btnAiTask.innerHTML = '<i class="ph-fill ph-check text-green-500"></i> Listo';
                setTimeout(() => btnAiTask.innerHTML = originalIcon, 2000);

            } catch (err) {
                console.error(err);
                alert("Error IA: " + err.message);
                btnAiTask.innerHTML = originalIcon;
            }
        };
    }

    if (btnToday && btnUpcoming) {
        btnToday.onclick = () => {
            timelineMode = 'today';
            btnToday.classList.add('active');
            btnUpcoming.classList.remove('active');
            updateTimeline(container, events);
        };

        btnUpcoming.onclick = () => {
            timelineMode = 'upcoming';
            btnUpcoming.classList.add('active');
            btnToday.classList.remove('active');
            updateTimeline(container, events);
        };
    }

    // Report Buttons
    const btnMyReport = container.querySelector('#btn-my-report');
    const btnGeneralReport = container.querySelector('#btn-general-report');

    if (btnMyReport) {
        btnMyReport.onclick = () => generateReport(container, 'user');
    }
    if (btnGeneralReport) {
        btnGeneralReport.onclick = () => generateReport(container, 'general');
    }
    // Promotions Logic
    const promoInput = container.querySelector('#promo-input-dash');
    const promoListEl = container.querySelector('#promotions-list');

    // Helper to update List
    const renderPromotionsWidget = async () => {
        if (!promoListEl) return;

        try {
            const { getPromotions, retryPromotionAnalysis, deletePromotion } = await import('../store.js');
            window.retryPromotion = retryPromotionAnalysis;

            // Expose safer delete wrapper
            window.deletePromoWrapper = (id) => {
                if (confirm('¿Seguro que quieres borrar esta promoción pendiente?')) {
                    deletePromotion(id);
                }
            };

            const list = getPromotions() || [];

            promoListEl.innerHTML = '';

            if (list.length === 0) {
                promoListEl.innerHTML = `
                    <div class="text-center p-6 opacity-50">
                        <i class="ph ph-files text-4xl mb-2"></i>
                        <p class="text-sm">No hay promociones pendientes.</p>
                    </div>
                `;
                return;
            }

            list.forEach(p => {
                const isAnalysing = p.status === 'analyzing';
                const isError = p.status === 'error';
                const statusClass = isAnalysing ? 'status-analyzing' : (isError ? 'status-error' : 'status-ready');
                const statusText = isAnalysing ? 'Analizando...' : (isError ? 'Error (Reintentar)' : 'Listo para Anexar');

                const item = document.createElement('div');
                item.className = `promo-item ${statusClass}`;

                // Main click opens viewer directly (User Request)
                item.onclick = async () => {
                    const { showImageViewer } = await import('./image_viewer.js');
                    showImageViewer(null, p.id, 'promotion');
                };

                let badgeHtml = `<span class="promo-status-badge">${statusText}</span>`;

                // Interactive Retry Badge
                if (isError) {
                    badgeHtml = `<span class="promo-status-badge cursor-pointer hover:text-white transition-colors" onclick="event.stopPropagation(); retryPromotion('${p.id}')">
                        <i class="ph-bold ph-arrow-clockwise"></i> ${statusText}
                     </span>`;
                }

                item.innerHTML = `
                    <div class="promo-icon-box">
                        ${p.url ? `<img src="${p.url}" class="promo-thumb" alt="preview">` : '<i class="ph ph-file-image text-cyan-400"></i>'}
                    </div>
                    <div class="promo-info flex-1 min-w-0 pr-2">
                        <div class="flex justify-between items-start">
                            <span class="promo-name truncate" title="${p.name}">${p.aiAnalysis?.concept || p.name}</span>
                            ${p.aiAnalysis?.filingDate ? `<span class="promo-date text-xs text-accent whitespace-nowrap ml-2">${p.aiAnalysis.filingDate}</span>` : ''}
                        </div>
                        <div class="promo-meta">
                            ${badgeHtml}
                            ${p.aiAnalysis?.court ? `<span class="truncate border-l border-white/10 pl-2 ml-1" style="max-width: 100px;">${p.aiAnalysis.court}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col items-center justify-center pl-2 border-l border-white/5 space-y-2">
                         <button class="text-zinc-500 hover:text-red-400 p-1 rounded-sm transition-colors" onclick="event.stopPropagation(); window.deletePromoWrapper('${p.id}')" title="Borrar">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                `;
                promoListEl.appendChild(item);
            });

        } catch (e) {
            console.error("Error rendering promotions widget:", e);
        }
    };

    // Initial render
    renderPromotionsWidget();
    window.addEventListener('promotions-updated', renderPromotionsWidget);

    if (promoInput) {
        promoInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Stay on dashboard, show feedback if needed
            // console.log("Subiendo archivo desde Dashboard...");

            const { addPromotion } = await import('../store.js');

            try {
                // Just add it, store will trigger 'promotions-updated'
                // Dashboard listens to this and re-renders the list in place
                await addPromotion(file);

                // Reset input to allow re-selecting same file if needed
                promoInput.value = '';
            } catch (err) {
                console.error(err);
                alert("Error subiendo promoción: " + err.message);
                renderPromotionsWidget();
            }
        };
    }
}

function generateReport(container, type) {
    const user = AuthService.getCurrentUser();
    const modal = container.querySelector('#infographic-modal');
    if (!modal) return;

    // 1. Gather Data
    const allEvents = getAllEvents(); // From store.js

    // Time range: Last 7 days
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    // Filter Logic
    let relevantTasks = [];
    let title = "";

    if (type === 'general') {
        title = "Reporte General del Despacho";
        relevantTasks = allEvents;
    } else {
        title = `Reporte Individual: ${user.name}`;
        // Filter tasks completed by user or assigned to user (logic approx)
        // Since we track 'completedBy', we use that for completed tasks.
        // For pending, we might not have 'assignedTo' in this simple MVP, so we verify creator or simple visibility.
        // For MVP: Show tasks completed by me, and ALL pending tasks (assuming shared workload) or just all my referenced acts.
        // Let's stick to actions: "Completed by me" + "Uploaded by me".

        // Actually, let's look at what we have in events:
        // Events have: id, title, date, type, urgent, completed, completedBy, caseId
        relevantTasks = allEvents.filter(e => {
            const isCompletedByMe = e.completed && e.completedBy && e.completedBy.uid === user.uid;
            // For pending tasks, we don't have explicit assignment, so we'll skip count pending specifically for user unless we add logic.
            // Let's include everything for now but highlight my actions.
            return true;
        });
    }

    // Metrics
    const completedTasks = relevantTasks.filter(e => e.completed && (!type || type === 'general' || (e.completedBy && e.completedBy.uid === user.uid)));
    const urgentPending = relevantTasks.filter(e => !e.completed && e.urgent).length;
    const completedCount = completedTasks.length;

    // Show Loading State with Progress Bar
    const containerInner = modal.querySelector('.infographic-container');
    if (containerInner) {
        containerInner.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center p-8">
                <i class="ph ph-sparkle text-5xl text-accent animate-pulse mb-4"></i>
                <h3 class="h3 mb-2">Generando Informe Inteligente...</h3>
                <p class="text-muted mb-4">Gemini está analizando ${relevantTasks.length} actividades...</p>
                
                <div class="w-full max-w-xs bg-glass rounded-full h-2.5 overflow-hidden">
                    <div id="ai-progress-bar" class="bg-accent h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <p id="ai-progress-text" class="text-xs text-muted mt-2">0%</p>
            </div>
         `;
        modal.classList.remove('hidden');
    }

    // Call AI
    import('../services/ai_service.js').then(async module => {
        try {
            const aiReportHtml = await module.AIAnalysisService.generateWeeklyReport({
                user: user.name,
                role: type,
                stats: { completed: completedCount, urgent_pending: urgentPending, total_monitored: relevantTasks.length },
                tasks_sample: relevantTasks.slice(0, 15).map(t => ({ title: t.title, status: t.completed ? 'Done' : 'Pending', urgent: t.urgent }))
            }, (percent) => {
                const bar = document.getElementById('ai-progress-bar');
                const txt = document.getElementById('ai-progress-text');
                if (bar) bar.style.width = `${percent}%`;
                if (txt) txt.textContent = `${percent}%`;
            });

            // Render Final Report
            const html = `
                <div class="report-content p-6 h-full overflow-y-auto">
                    <div class="text-center mb-6">
                        <i class="ph-duotone ph-chart-polar text-5xl text-accent mb-2"></i>
                        <h2 class="h2 text-gradient">${title}</h2>
                        <p class="text-sm text-muted">${lastWeek.toLocaleDateString()} - ${today.toLocaleDateString()}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="stat-card glass-panel p-4 rounded-xl text-center">
                            <div class="text-3xl font-bold text-accent">${completedCount}</div>
                            <div class="text-xs text-muted uppercase">Tareas Completadas</div>
                        </div>
                         <div class="stat-card glass-panel p-4 rounded-xl text-center">
                            <div class="text-3xl font-bold text-red-400">${urgentPending}</div>
                            <div class="text-xs text-muted uppercase">Urgentes Pendientes</div>
                        </div>
                    </div>

                    <div class="glass-panel p-6 rounded-xl border border-glass mb-6 prose prose-invert max-w-none text-sm">
                        ${aiReportHtml}
                    </div>
                    
                    <button class="btn-primary w-full mt-2" onclick="document.getElementById('infographic-modal').classList.add('hidden')">
                        Entendido
                    </button>
                </div>
            `;
            if (containerInner) containerInner.innerHTML = html;

        } catch (e) {
            console.error(e);
            if (containerInner) containerInner.innerHTML = `<div class="p-8 text-center"><h3 class="text-danger">Error generando reporte</h3><p>${e.message}</p></div>`;
        }
    });
}
