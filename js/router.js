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
            } else if (hash === '#calendar') {
                viewContainer.appendChild(module.createCalendarView());
            } else if (hash === '#tasks') {
                viewContainer.appendChild(module.createTasksView());
            }
        }).catch(err => {
            console.error("Error loading view:", err);
            if (requestId === currentRequestId) {
                viewContainer.innerHTML = '<div class="p-6"><h2>Error cargando la vista</h2><p>' + err.message + '</p></div>';
            }
        });
    };

    // Auth Guard
    const { AuthService } = await import('./services/auth.js');

    if (hash === '#login') {
        if (AuthService.isAuthenticated()) {
            window.location.hash = '#dashboard';
            return;
        }
        loadView(import(`./views/login_view.js?v=${v}`));
        // Hide sidebar for login
        document.body.classList.add('login-mode');
        return;
    }

    if (!AuthService.isAuthenticated()) {
        window.location.hash = '#login';
        return;
    }

    // Remove login mode class if present
    document.body.classList.remove('login-mode');

    // Simple routing logic
    if (hash === '#dashboard') {
        loadView(import(`./views/dashboard.js?v=${v}`));
    } else if (hash.startsWith('#folder')) {
        loadView(import(`./views/folder_view.js?v=${v}`));
    } else if (hash.startsWith('#case')) {
        loadView(import(`./views/case_view.js?v=${v}`));
    } else if (hash === '#calendar') {
        loadView(import(`./views/calendar_view.js?v=${v}`));
    } else if (hash === '#tasks') {
        loadView(import(`./views/tasks_view.js?v=${v}`));
    } else {
        // 404
        viewContainer.innerHTML = '<h2>404 - Not Found</h2>';
    }
}
