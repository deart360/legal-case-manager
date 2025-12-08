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
        html += `<div class="cal-day empty bg-black/20 rounded-lg"></div>`;
    }

    // Days
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = dateStr === todayStr;

        html += `
            <div class="cal-day ${isToday ? 'bg-accent/10 border-accent' : 'bg-glass'} border border-glass rounded-lg p-2 min-h-[100px] flex flex-col gap-1 transition-colors hover:bg-glass-hover">
                <span class="day-number font-bold ${isToday ? 'text-accent' : 'text-muted'} mb-1">${day}</span>
                <div class="day-events flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    ${dayEvents.map(e => {
            let clickAction = '';
            if (e.imgId) {
                clickAction = `onclick="event.stopPropagation(); window.openImage('${e.caseId}', '${e.imgId}')"`;
            } else if (e.caseId) {
                clickAction = `onclick="event.stopPropagation(); window.navigateTo('#case/${e.caseId}')"`;
            }
            return `
                        <div class="cal-event text-xs p-1 rounded border-l-2 cursor-pointer truncate
                            ${e.urgent ? 'border-danger bg-danger/10 text-danger-light' : 'border-accent bg-accent/10 text-accent-light'}" 
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
