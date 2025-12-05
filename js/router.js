export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // Initial load
}

function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const viewContainer = document.getElementById('view-container');

    console.log('Navigating to:', hash);

    viewContainer.innerHTML = ''; // Clear current view

    // Simple routing logic
    if (hash === '#dashboard') {
        import('./views/dashboard.js').then(module => {
            viewContainer.appendChild(module.createDashboardView());
        });
    } else if (hash.startsWith('#folder')) {
        import('./views/folder_view.js').then(module => {
            const folderId = hash.split('/')[1];
            viewContainer.appendChild(module.createFolderView(folderId));
        });
    } else if (hash.startsWith('#case')) {
        import('./views/case_view.js').then(module => {
            const caseId = hash.split('/')[1];
            viewContainer.appendChild(module.createCaseView(caseId));
        });
    } else {
        viewContainer.innerHTML = '<h2>404 - Not Found</h2>';
    }
}
