import { appData, getAllEvents } from '../store.js';

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

    const header = `
        <div class="dash-header mb-6">
            <div>
                <h1 class="h2">Panel de Control</h1>
                <p class="text-muted">Resumen de actividad y términos</p>
            </div>
            <div class="date-display">
                <span class="text-sm font-medium">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
        </div>
    `;

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

                        <div class="form-group">
                            <label class="text-xs text-muted uppercase font-bold">Descripción</label>
                            <textarea id="qt-desc" class="form-input text-sm" rows="2" placeholder="Detalles de la tarea..."></textarea>
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

                <!-- AI Weekly Report -->
                <div class="card ai-report-card">
                    <div class="card-header">
                        <h3 class="h3"><i class="ph-fill ph-sparkle text-accent"></i> Reporte Semanal AI</h3>
                    </div>
                    <div class="report-summary-content">
                        <p class="text-sm text-muted mb-4">
                            Esta semana se han atendido <strong class="text-white">12 acuerdos</strong> y <strong class="text-white">3 términos</strong>. 
                            La carga de trabajo ha aumentado un 15% respecto a la semana anterior.
                        </p>
                        <button class="btn-primary w-full" id="btn-generate-infographic">
                            <i class="ph ph-presentation-chart"></i> Ver Infografía Detallada
                        </button>
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

    // Infographic Modal
    const modal = container.querySelector('#infographic-modal');
    const btnOpen = container.querySelector('#btn-generate-infographic');
    const btnClose = container.querySelector('#close-infographic');

    if (btnOpen && modal && btnClose) {
        btnOpen.onclick = () => {
            modal.classList.remove('hidden');
        };

        btnClose.onclick = () => {
            modal.classList.add('hidden');
        };

        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        };
    }
}
