import { getAllEvents } from '../store.js';

let currentDate = new Date();

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
            <div class="cal-body grid grid-cols-7 flex-1 gap-1 overflow-y-auto" id="calendar-grid">
                <!-- Content rendered by JS -->
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
        html += `<div class="cal-day empty" style="background: rgba(0,0,0,0.2); border-radius: 8px;"></div>`;
    }

    // Days
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = dateStr === todayStr;

        const dayClass = isToday ? 'bg-accent-low border-accent' : 'bg-glass';
        const dayStyle = isToday ? 'background: rgba(212, 175, 55, 0.1); border-color: var(--accent);' : '';
        const numClass = isToday ? 'text-accent' : 'text-muted';

        html += `
            <div class="cal-day ${dayClass}" style="${dayStyle} border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.5rem; min-height: 100px; display: flex; flex-direction: column; gap: 0.25rem; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='${isToday ? 'rgba(212, 175, 55, 0.1)' : ''}'">
                <span class="day-number font-bold ${numClass} mb-1" style="font-weight: 700;">${day}</span>
                <div class="day-events flex flex-col gap-1 overflow-y-auto custom-scrollbar" style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto;">
                    ${dayEvents.map(e => {
            let clickAction = '';
            if (e.imgId) {
                clickAction = `onclick="event.stopPropagation(); window.openImage('${e.caseId}', '${e.imgId}')"`;
            } else if (e.caseId) {
                clickAction = `onclick="event.stopPropagation(); window.navigateTo('#case/${e.caseId}')"`;
            }

            const eventStyle = e.urgent
                ? 'border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #fca5a5;'
                : 'border: 1px solid rgba(212, 175, 55, 0.3); background: rgba(212, 175, 55, 0.1); color: #fcd34d;';

            return `
                        <div class="cal-event text-xs p-1 rounded border-l-2 cursor-pointer truncate"
                            style="${eventStyle} font-size: 0.75rem; padding: 2px 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                            title="${e.title}" ${clickAction}>
                            ${e.type === 'deadline' ? '⚠️ ' : ''}${e.title}
                        </div>
                    `}).join('')}
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
}
