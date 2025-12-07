/**
 * Responsive Sidebar Logic
 * Handles opening/closing sidebar on mobile and backdrop interactions.
 */

export function initResponsive() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const navItems = document.querySelectorAll('.nav-item');

    if (!menuToggle || !sidebar || !backdrop) return;

    // Toggle Sidebar
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('visible');
    });

    // Close when clicking backdrop
    backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('visible');
    });

    // Close when clicking a nav item (on mobile)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                sidebar.classList.remove('open');
                backdrop.classList.remove('visible');
            }
        });
    });

    // Handle resize events to reset state if needed
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('visible');
        }
    });
}
