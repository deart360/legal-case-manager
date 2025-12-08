let currentRequestId = 0;

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Initial load
}

function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const viewContainer = document.getElementById('view-container');
    const requestId = ++currentRequestId;

    console.log('Navigating to:', hash, 'ReqID:', requestId);

    // Helper to handle view loading
    const loadView = (promise) => {
        promise.then(module => {
            // If a newer request started, ignore this one
            if (requestId !== currentRequestId) return;

            viewContainer.innerHTML = ''; // Clear only when ready

            if (hash === '#dashboard') {
                viewContainer.appendChild(module.createDashboardView());
            } else if (hash.startsWith('#folder')) {
                const folderId = hash.split('/')[1];
                viewContainer.appendChild(module.createFolderView(folderId));
            } else if (hash.startsWith('#case')) {
                const caseId = hash.split('/')[1];
                viewContainer.appendChild(module.createCaseView(caseId));
            }
        }).catch(err => {
            console.error("Error loading view:", err);
            if (requestId === currentRequestId) {
                viewContainer.innerHTML = '<div class="p-6"><h2>Error cargando la vista</h2><p>' + err.message + '</p></div>';
            }
        });
    };

    // Simple routing logic
    if (hash === '#dashboard') {
        loadView(import('./views/dashboard.js'));
    } else if (hash.startsWith('#folder')) {
        loadView(import('./views/folder_view.js'));
    } else if (hash.startsWith('#case')) {
        loadView(import('./views/case_view.js'));
    } else if (hash === '#calendar') {
        loadView(import('./views/calendar_view.js'));
    } else {
        // 404
        viewContainer.innerHTML = '<h2>404 - Not Found</h2>';
    }
}
