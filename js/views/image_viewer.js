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
}
