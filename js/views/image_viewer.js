import { getCase } from '../store.js';

let currentCaseId = null;
let currentImageId = null;
let zoomLevel = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

export function showImageViewer(caseId, imgId) {
    const modal = document.getElementById('image-viewer-modal');
    currentCaseId = caseId;
    currentImageId = imgId;

    // Reset Zoom/Pan
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;

    renderContent(modal);
    modal.classList.remove('hidden');

    // Bind Events
    bindEvents(modal);
}

function renderContent(modal) {
    const c = getCase(currentCaseId);
    const img = c.images.find(i => i.id === currentImageId);

    if (!img) return;

    modal.innerHTML = `
        <div class="viewer-container">
            <!-- Main Image Area -->
            <div class="viewer-main">
                <div class="viewer-toolbar">
                    <button id="close-viewer" class="btn-icon"><i class="ph ph-x"></i></button>
                    <div class="zoom-controls">
                        <button id="btn-gallery-mode" class="btn-icon" title="Modo Galería"><i class="ph-fill ph-corners-out"></i></button>
                        <div class="divider-v"></div>
                        <button id="zoom-out" class="btn-icon"><i class="ph ph-minus"></i></button>
                        <span id="zoom-level">100%</span>
                        <button id="zoom-in" class="btn-icon"><i class="ph ph-plus"></i></button>
                    </div>
                </div>
                
                <div class="image-wrapper" id="image-wrapper">
                    <img src="${img.url}" id="active-image" alt="Documento" draggable="false">
                </div>
            </div>

            <!-- AI Sidebar -->
            <div class="viewer-sidebar">
                <div class="sidebar-section">
                    <h3 class="h3 mb-2">Análisis AI</h3>
                    <div class="ai-card">
                        <div class="ai-header">
                            <i class="ph-fill ph-sparkle text-accent"></i>
                            <span class="font-bold">Resumen Inteligente</span>
                        </div>
                        <p class="text-sm mt-2">${img.summary}</p>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="h3 mb-2">Detalles Procesales</h3>
                    <div class="detail-row">
                        <span class="label">Tipo</span>
                        <span class="value">${img.type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Vencimiento</span>
                        <span class="value ${img.deadline ? 'text-danger' : ''}">${img.deadline || 'N/A'}</span>
                    </div>
                </div>

                <div class="sidebar-section">
                    <h3 class="h3 mb-2">Próxima Actuación</h3>
                    <div class="next-action-card">
                        <i class="ph ph-arrow-right"></i>
                        <p>${img.nextAction}</p>
                    </div>
                </div>
                
                <div class="sidebar-footer-actions">
                     <button class="btn-primary w-full">Generar Escrito</button>
                </div>
            </div>
        </div>
    `;
}

function bindEvents(modal) {
    const imgWrapper = document.getElementById('image-wrapper');
    const activeImg = document.getElementById('active-image');

    // Close
    document.getElementById('close-viewer').onclick = () => modal.classList.add('hidden');

    // Zoom
    const updateTransform = () => {
        activeImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
        document.getElementById('zoom-level').innerText = `${Math.round(zoomLevel * 100)}%`;
    };

    document.getElementById('zoom-in').onclick = () => { zoomLevel += 0.2; updateTransform(); };
    document.getElementById('zoom-out').onclick = () => { if (zoomLevel > 0.4) zoomLevel -= 0.2; updateTransform(); };

    // Pan (Mouse)
    imgWrapper.onmousedown = (e) => {
        if (zoomLevel > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            imgWrapper.style.cursor = 'grabbing';
        }
    };

    window.onmousemove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    };

    window.onmouseup = () => {
        isDragging = false;
        imgWrapper.style.cursor = 'default';
    };

    // Wheel Zoom
    imgWrapper.onwheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(.5, zoomLevel + delta), 4);
        zoomLevel = newZoom;
        updateTransform();
    };

    // Gallery Mode Toggle
    const btnGallery = document.getElementById('btn-gallery-mode');
    const viewerContainer = modal.querySelector('.viewer-container');

    if (btnGallery) {
        btnGallery.onclick = () => {
            viewerContainer.classList.toggle('gallery-mode');
            const isGallery = viewerContainer.classList.contains('gallery-mode');
            btnGallery.innerHTML = isGallery ? '<i class="ph-fill ph-corners-in"></i>' : '<i class="ph-fill ph-corners-out"></i>';

            if (isGallery) {
                // Reset zoom for gallery mode swipe
                zoomLevel = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
            }
        };
    }

    // Keyboard Navigation
    currentKeydownHandler = (e) => {
        if (!viewerContainer.classList.contains('gallery-mode')) return;
        if (e.key === 'ArrowLeft') navigateImage(-1);
        if (e.key === 'ArrowRight') navigateImage(1);
        if (e.key === 'Escape') {
            viewerContainer.classList.remove('gallery-mode');
            const btn = document.getElementById('btn-gallery-mode');
            if (btn) btn.innerHTML = '<i class="ph-fill ph-corners-out"></i>';
        }
    };
    window.addEventListener('keydown', currentKeydownHandler);

    // On-screen Navigation Buttons (for Desktop)
    const navOverlay = document.createElement('div');
    navOverlay.className = 'gallery-nav-overlay';
    navOverlay.innerHTML = `
        <button class="gallery-nav-btn prev"><i class="ph ph-caret-left"></i></button>
        <button class="gallery-nav-btn next"><i class="ph ph-caret-right"></i></button>
    `;
    viewerContainer.appendChild(navOverlay);

    navOverlay.querySelector('.prev').onclick = (e) => { e.stopPropagation(); navigateImage(-1); };
    navOverlay.querySelector('.next').onclick = (e) => { e.stopPropagation(); navigateImage(1); };

    // Swipe Navigation (Simple implementation)
    let touchStartX = 0;
    let touchEndX = 0;

    imgWrapper.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    imgWrapper.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (!viewerContainer.classList.contains('gallery-mode')) return;

        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe Left -> Next Image
            navigateImage(1);
        }
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe Right -> Previous Image
            navigateImage(-1);
        }
    }

    async function navigateImage(direction) {
        const { getCase } = await import('../store.js');
        const c = getCase(currentCaseId);
        if (!c || !c.images) return;

        const currentIndex = c.images.findIndex(i => i.id === currentImageId);
        if (currentIndex === -1) return;

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = c.images.length - 1; // Loop
        if (newIndex >= c.images.length) newIndex = 0; // Loop

        const newImg = c.images[newIndex];
        currentImageId = newImg.id;

        // Cleanup old listeners before re-rendering
        cleanup();

        // Update View
        renderContent(modal);

        // Restore Gallery Mode
        const newContainer = modal.querySelector('.viewer-container');
        newContainer.classList.add('gallery-mode');

        // Re-bind events
        bindEvents(modal);

        // Update button icon
        const btn = document.getElementById('btn-gallery-mode');
        if (btn) btn.innerHTML = '<i class="ph-fill ph-corners-in"></i>';
    }
}
