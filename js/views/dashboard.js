import { appData, getAllEvents } from '../store.js';

let currentDate = new Date();
let timelineMode = 'today'; // 'today' or 'upcoming'

export function createDashboardView() {
    const container = document.createElement('div');
    container.className = 'dashboard-view p-6';

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
            <!-- Left Column: Calendar & Timeline -->
            <div class="left-col flex flex-col gap-4">
                
                <!-- Timeline -->
                <div class="card timeline-card">
                    <div class="card-header">
                        <h3 class="h3">Agenda</h3>
                        <div class="segmented-control">
                            <button class="segment-btn ${timelineMode === 'today' ? 'active' : ''}" id="btn-today">Hoy</button>
                            <button class="segment-btn ${timelineMode === 'upcoming' ? 'active' : ''}" id="btn-upcoming">Semanal</button>
                        </div>
                    </div>
                    <div class="timeline-list" id="timeline-container">
                        <!-- Content rendered by JS -->
                    </div>
                </div>
                
                <!-- Calendar -->
                <div class="card calendar-card">
                    <div class="card-header">
                        <h3 class="h3" id="cal-month-label">Calendario</h3>
                        <div class="cal-nav">
                            <button class="btn-icon-sm" id="cal-prev"><i class="ph ph-caret-left"></i></button>
                            <button class="btn-text-sm" id="cal-today">Hoy</button>
                            <button class="btn-icon-sm" id="cal-next"><i class="ph ph-caret-right"></i></button>
                        </div>
                    </div>
                    <div class="calendar-wrapper">
                        <div class="cal-header">
                            <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
                        </div>
                        <div class="cal-body" id="calendar-grid">
                            <!-- Content rendered by JS -->
                        </div>
                    </div>
                </div>

            </div>

            <!-- Right Column: Widgets -->
            <div class="right-col flex flex-col gap-4">
                
                <!-- Urgent Terms Widget -->
                <div class="card urgent-widget">
                    <div class="card-header">
                        <h3 class="h3 text-danger"><i class="ph-fill ph-warning-circle"></i> Términos (2 Semanas)</h3>
                    </div>
                    <div class="urgent-list" id="urgent-terms-list">
                         <!-- Dynamic Content -->
                    </div>
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
    `;

    container.innerHTML = header + dashboardHtml;

    // Render Sub-components
    updateTimeline(container, events);
    updateCalendar(container, events);
    updateUrgentTerms(container, events);

    // Bind Events
    bindDashboardEvents(container, events);
}

function updateUrgentTerms(container, events) {
    const listContainer = container.querySelector('#urgent-terms-list');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoWeeksOut = new Date(today);
    twoWeeksOut.setDate(today.getDate() + 14);

    // Filter for urgent tasks or deadlines within the next 14 days
    const urgentEvents = events.filter(e => {
        const eDate = new Date(e.date + 'T00:00:00');
        return (e.urgent || e.type === 'deadline') && eDate >= today && eDate <= twoWeeksOut;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (urgentEvents.length === 0) {
        listContainer.innerHTML = '<div class="text-muted text-sm text-center">No hay términos próximos.</div>';
        return;
    }

    listContainer.innerHTML = urgentEvents.map(e => {
        const eDate = new Date(e.date + 'T00:00:00');
        const diffTime = eDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let daysLabel = 'días';
        let daysClass = '';

        if (diffDays === 0) { daysLabel = 'HOY'; daysClass = 'text-danger'; }
        else if (diffDays === 1) { daysLabel = 'día'; }

        // Clean title for display
        const title = e.title.split('(')[0].trim();
        const sub = e.title.match(/\(([^)]+)\)/)?.[1] || 'Pendiente';

        return `
            <div class="term-item">
                <div class="term-info">
                    <span class="case-ref">${sub}</span>
                    <span class="term-desc">${title}</span>
                    <span class="text-xs text-muted">${eDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div class="countdown ${diffDays <= 3 ? 'bg-red-900/20 border-red-500/30' : ''}">
                    <span class="days ${daysClass}">${diffDays}</span>
                    <span class="label">${daysLabel}</span>
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

function updateCalendar(container, events) {
    const grid = container.querySelector('#calendar-grid');
    const label = container.querySelector('#cal-month-label');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    label.innerText = currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    let html = '';

    // Empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div class="cal-day empty"></div>`;
    }

    // Days
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = dateStr === todayStr;

        html += `
            <div class="cal-day ${isToday ? 'today' : ''}">
                <span class="day-number">${day}</span>
                <div class="day-events">
                    ${dayEvents.map(e => {
            let clickAction = '';
            if (e.imgId) {
                clickAction = `onclick="event.stopPropagation(); window.openImage('${e.caseId}', '${e.imgId}')"`;
            } else if (e.caseId) {
                clickAction = `onclick="event.stopPropagation(); window.navigateTo('#case/${e.caseId}')"`;
            }
            return `
                        <div class="cal-event ${e.type} ${e.urgent ? 'urgent' : ''}" title="${e.title}" ${clickAction}>
                            ${e.type === 'attachment' ? '<i class="ph-fill ph-camera"></i>' : ''}
                            ${e.type === 'deadline' ? '<i class="ph-fill ph-warning"></i>' : ''}
                            <span>${e.title}</span>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
}

function bindDashboardEvents(container, events) {
    // Timeline Switch
    const btnToday = container.querySelector('#btn-today');
    const btnUpcoming = container.querySelector('#btn-upcoming');

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

    // Calendar Nav
    container.querySelector('#cal-prev').onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar(container, events);
    };

    container.querySelector('#cal-next').onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar(container, events);
    };

    container.querySelector('#cal-today').onclick = () => {
        currentDate = new Date();
        updateCalendar(container, events);
    };

    // Infographic Modal
    const modal = container.querySelector('#infographic-modal');
    const btnOpen = container.querySelector('#btn-generate-infographic');
    const btnClose = container.querySelector('#close-infographic');

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
