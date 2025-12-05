/**
 * Main Application Entry Point
 */
import { initRouter } from './router.js';
import { renderSidebar } from './components/sidebar.js';
import { appData } from './store.js';
import { showImageViewer } from './views/image_viewer.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Legal App Initializing...');

    try {
        // Initialize Core layout
        renderSidebar();

        // Start Routing
        initRouter();
    } catch (err) {
        console.error("Critical Init Error:", err);
        alert("Error crítico al iniciar la app:\n" + err.message + "\n\nVerifica la consola para más detalles.");
    }

    // Listen for hash changes to re-render sidebar (simple reactivity)
    window.addEventListener('hashchange', () => {
        renderSidebar();
    });
});

// Expose simple navigation helper globally for inline onclicks if needed
window.navigateTo = (hash) => {
    window.location.hash = hash;
};

window.openImage = (caseId, imgId) => {
    showImageViewer(caseId, imgId);
};

// Global Actions
window.promptAddSubject = (stateId) => {
    const name = prompt('Nombre de la nueva materia (ej. Mercantil):');
    if (name) {
        import('./store.js').then(store => {
            store.addSubject(stateId, name);
            // Refresh view
            import('./router.js').then(r => r.initRouter());
            // Force reload of current hash
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        });
    }
};

window.promptAddCase = (subjectId) => {
    const title = prompt('Título del Asunto (ej. Juicio Sucesorio):');
    if (!title) return;
    const expediente = prompt('Número de Expediente (ej. 555/2024):');
    if (!expediente) return;
    const juzgado = prompt('Juzgado (ej. Juzgado 1 Civil):');

    import('./store.js').then(store => {
        const newId = store.addCase(subjectId, title, expediente, juzgado || 'Sin asignar');
        window.navigateTo(`#case/${newId}`);
    });
};
