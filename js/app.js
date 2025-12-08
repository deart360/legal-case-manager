/**
 * Main Application Entry Point
 */
import { initRouter } from './router.js';
import { initSidebar } from './components/sidebar.js';
import { initResponsive } from './responsive.js';
import { appData } from './store.js';
import { showImageViewer } from './views/image_viewer.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Legal App Initializing...');
    initResponsive();

    try {
        // Initialize Core layout
        initSidebar();

        // Global Error Handler
        window.onerror = function (msg, url, lineNo, columnNo, error) {
            // Ignore generic "Script error." from cross-origin scripts (like Firebase)
            if (msg.toLowerCase().includes('script error')) {
                console.warn('Ignored cross-origin script error:', msg);
                return false;
            }

            const errorMsg = `Error Global:\n${msg}\n\nEn: ${url}:${lineNo}`;
            console.error(errorMsg, error);
            // alert(errorMsg); // Disable alert for production/mobile to avoid annoyance
            return false;
        };

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

// --- Modal Logic ---

window.openCaseModal = async (subjectId, caseId = null) => {
    const modal = document.getElementById('case-modal');
    const form = document.getElementById('case-form');
    const title = document.getElementById('case-modal-title');

    // Reset form
    form.reset();
    document.getElementById('case-id').value = '';
    document.getElementById('case-subject-id').value = subjectId || '';

    if (caseId) {
        // Edit Mode
        title.innerText = 'Editar Expediente';
        document.getElementById('case-id').value = caseId;

        // Load data
        const store = await import('./store.js');
        const c = store.getCase(caseId);
        if (c) {
            document.getElementById('case-expediente').value = c.expediente || '';

            // Parse Juzgado: "Juzgado 12 F.oral" -> Num: 12, Type: F.oral
            const juzgadoMatch = (c.juzgado || '').match(/Juzgado\s+(\d+)\s*(.*)/);
            if (juzgadoMatch) {
                document.getElementById('case-juzgado-num').value = juzgadoMatch[1];
                document.getElementById('case-juzgado-type').value = juzgadoMatch[2] || '';
            } else {
                // Fallback if format doesn't match
                document.getElementById('case-juzgado-num').value = (c.juzgado || '').replace(/\D/g, '');
                document.getElementById('case-juzgado-type').value = '';
            }

            document.getElementById('case-juicio').value = c.juicio || '';
            document.getElementById('case-actor').value = c.actor || '';

            if (c.demandado) {
                document.getElementById('case-demandado').value = c.demandado;
                document.getElementById('case-no-demandado').checked = false;
                document.getElementById('case-demandado').disabled = false;
            } else {
                document.getElementById('case-no-demandado').checked = true;
                document.getElementById('case-demandado').value = '';
                document.getElementById('case-demandado').disabled = true;
            }
        }
    } else {
        // Add Mode
        title.innerText = 'Nuevo Expediente';
    }

    modal.classList.remove('hidden');
};

window.closeCaseModal = () => {
    document.getElementById('case-modal').classList.add('hidden');
};

window.toggleDemandado = (checkbox) => {
    const input = document.getElementById('case-demandado');
    if (checkbox.checked) {
        input.value = '';
        input.disabled = true;
    } else {
        input.disabled = false;
    }
};

// Form Submission
document.getElementById('case-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const caseId = document.getElementById('case-id').value;
    const subjectId = document.getElementById('case-subject-id').value;

    const juzgadoNum = document.getElementById('case-juzgado-num').value;
    const juzgadoType = document.getElementById('case-juzgado-type').value;

    const data = {
        expediente: document.getElementById('case-expediente').value,
        juzgado: `Juzgado ${juzgadoNum} ${juzgadoType}`.trim(), // Format: Juzgado 12 F.oral
        juicio: document.getElementById('case-juicio').value,
        actor: document.getElementById('case-actor').value,
        demandado: document.getElementById('case-no-demandado').checked ? null : document.getElementById('case-demandado').value
    };

    const store = await import('./store.js');

    if (caseId) {
        // Update
        await store.updateCase(caseId, data);
    } else {
        // Create
        await store.addCase(subjectId, data);
    }

    window.closeCaseModal();

    // Refresh
    window.dispatchEvent(new HashChangeEvent('hashchange'));
});

window.confirmDeleteCase = async (caseId) => {
    if (confirm('¿Estás seguro de eliminar este expediente? Esta acción no se puede deshacer.')) {
        const store = await import('./store.js');
        const result = await store.deleteCase(caseId);
        if (result) {
            window.location.hash = '#dashboard';
        } else {
            alert('Error al eliminar el expediente');
        }
    }
};

window.confirmDeleteImage = async (caseId, imgId) => {
    if (confirm('¿Eliminar este documento del expediente?')) {
        const { deleteImageFromCase } = await import('./store.js');
        const result = await deleteImageFromCase(caseId, imgId);
        if (result) {
            // Force refresh of current view
            const currentHash = window.location.hash;
            window.location.hash = '';
            setTimeout(() => {
                window.location.hash = currentHash;
            }, 10);
        } else {
            alert('Error al eliminar la imagen');
        }
    }
};
