import { getAllEvents } from '../store.js';

let currentDate = new Date();
let selectedDate = new Date(); // Track selected date for modal navigation

export function createCalendarView() {
    const container = document.createElement('div');
    container.className = 'calendar-view p-6 h-full flex flex-col';

    const header = `
        <div class="view-header mb-6 flex justify-between items-center">
            <div>
                <h1 class="h2">Calendario Mensual</h1>
                <p class="text-muted">Vista general de términos y audiencias</p>
            </div>
            <div class="cal-controls flex gap-2">
                <button class="btn-secondary" id="cal-today">Hoy</button>
                <div class="flex items-center bg-glass rounded-lg border border-glass p-1">
                    <button class="btn-icon-sm" id="cal-prev"><i class="ph ph-caret-left"></i></button>
                    <span class="mx-4 font-bold w-32 text-center" id="cal-month-label"></span>
                    <button class="btn-icon-sm" id="cal-next"><i class="ph ph-caret-right"></i></button>
                </div>
            </div>
        </div>
    `;

    const calendarHtml = `
        <div class="glass-card flex-1 flex flex-col overflow-hidden p-4">
            <div class="cal-header grid grid-cols-7 mb-2 text-center text-muted font-bold uppercase text-sm">
                <span>Domingo</span><span>Lunes</span><span>Martes</span><span>Miércoles</span><span>Jueves</span><span>Viernes</span><span>Sábado</span>
            </div>
            <div class="cal-body" id="calendar-grid">
                <!-- Content rendered by JS -->
            </div>
        </div>

        <!-- Day Detail Modal -->
        <div id="day-detail-modal" class="modal hidden">
            <div class="modal-content glass-card day-modal-content animate-scale-in">
                <div class="day-modal-header">
                    <h3 class="h3" id="modal-date-title">Detalles del Día</h3>
                    <button class="btn-icon-sm" id="close-day-modal"><i class="ph ph-x"></i></button>
                </div>
                
                <div class="day-events-list custom-scrollbar" id="modal-events-list">
                    <!-- Events go here -->
                </div>

                <div class="day-modal-nav">
                    <button class="btn-secondary" id="modal-prev-day"><i class="ph ph-caret-left"></i> Anterior</button>
                    <button class="btn-secondary" id="modal-next-day">Siguiente <i class="ph ph-caret-right"></i></button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = header + calendarHtml;

    const events = getAllEvents();
    updateCalendar(container, events);
    bindEvents(container, events);

    return container;
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

        const dayClass = isToday ? 'today' : '';

        // Show max 3 events, then "+X more"
        const maxEvents = 3;
        const visibleEvents = dayEvents.slice(0, maxEvents);
        const moreCount = dayEvents.length - maxEvents;

        html += `
            <div class="cal-day ${dayClass}" onclick="window.openDayModal('${dateStr}')">
                <span class="day-number">${day}</span>
                <div class="day-events">
                    ${visibleEvents.map(e => {
            const isUrgent = e.urgent || e.type === 'deadline';
            const style = isUrgent
                ? 'background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.3);'
                : '';
            return `
                            <div class="cal-event" style="${style}">
                                ${e.type === 'deadline' ? '⚠️ ' : ''}${e.title}
                            </div>
                        `;
        }).join('')}
                    ${moreCount > 0 ? `<div class="cal-event more-events">+${moreCount} más</div>` : ''}
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
}

function bindEvents(container, events) {
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

    // Modal Logic
    const modal = container.querySelector('#day-detail-modal');
    const closeBtn = container.querySelector('#close-day-modal');
    const prevBtn = container.querySelector('#modal-prev-day');
    const nextBtn = container.querySelector('#modal-next-day');

    const closeModal = () => modal.classList.add('hidden');

    if (closeBtn) closeBtn.onclick = closeModal;
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            selectedDate.setDate(selectedDate.getDate() - 1);
            renderDayModalContent(container, selectedDate, events);
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            selectedDate.setDate(selectedDate.getDate() + 1);
            renderDayModalContent(container, selectedDate, events);
        };
    }

    // Expose open function globally
    window.openDayModal = (dateStr) => {
        // Parse date correctly (avoid timezone issues with simple split)
        const [y, m, d] = dateStr.split('-').map(Number);
        selectedDate = new Date(y, m - 1, d);

        renderDayModalContent(container, selectedDate, events);
        modal.classList.remove('hidden');
    };
}

function renderDayModalContent(container, date, allEvents) {
    const title = container.querySelector('#modal-date-title');
    const list = container.querySelector('#modal-events-list');

    // Update Title
    title.innerText = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    title.style.textTransform = 'capitalize';

    // Filter Events
    const dateStr = date.toISOString().split('T')[0];
    const events = allEvents.filter(e => e.date === dateStr);

    if (events.length === 0) {
        list.innerHTML = '<div class="text-center text-muted p-8">No hay eventos para este día.</div>';
        return;
    }

    list.innerHTML = events.map(e => {
        let icon = '<i class="ph ph-calendar-blank"></i>';
        if (e.type === 'deadline') icon = '<i class="ph-fill ph-warning-circle text-danger"></i>';
        if (e.type === 'attachment') icon = '<i class="ph ph-file-text"></i>';

        const isUrgent = e.urgent || e.type === 'deadline';

        let actionBtn = '';
        if (e.caseId) {
            actionBtn = `<button class="btn-text-sm mt-2" onclick="window.navigateTo('#case/${e.caseId}')">Ver Expediente</button>`;
        }

        return `
            <div class="day-event-item ${isUrgent ? 'urgent' : ''}">
                <div class="day-event-icon">
                    ${icon}
                </div>
                <div class="day-event-info">
                    <div class="day-event-title">${e.title}</div>
                    <div class="day-event-meta">
                        ${e.type === 'deadline' ? '<span class="text-danger font-bold">VENCIMIENTO</span> • ' : ''}
                        ${e.caseId ? `Expediente: ${e.caseId}` : 'Evento General'}
                    </div>
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}
