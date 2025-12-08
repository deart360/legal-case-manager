import { getCase } from '../store.js';

let currentCaseId = null;
let currentImageId = null;
let zoomLevel = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let currentKeydownHandler = null;

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
    modal.innerHTML = `
        < div class="viewer-container" >
            < !--Mobile Top Bar(Overlay)-- >
            <div class="mobile-top-bar">
                 <button id="close-viewer" class="btn-icon transparent"><i class="ph ph-arrow-left"></i></button>
                 <span class="file-title text-sm truncate">${img.name}</span>
                 <div class="spacer"></div> <!-- Balance layout -->
            </div>

            <!--Main Image Area-- >
            <div class="viewer-main">
                <div class="image-wrapper" id="image-wrapper">
                    <img src="${img.url}" id="active-image" alt="Documento" draggable="false">
                </div>
            </div>

            <!--Floating Bottom Bar(Mobile)-- >
            <div class="mobile-bottom-bar">
                <button id="btn-share" class="action-btn">
                    <i class="ph ph-share-network"></i>
                    <span>Compartir</span>
                </button>
                <div class="divider-v"></div>
                <button id="btn-download" class="action-btn">
                    <i class="ph ph-download-simple"></i>
                    <span>Descargar</span>
                </button>
                <div class="divider-v"></div>
                <button id="btn-info" class="action-btn">
                    <i class="ph ph-info"></i>
                    <span>Detalles IA</span>
                </button>
            </div>

            <!--Bottom Sheet(AI Info) - Hidden by default -->
            <div class="bottom-sheet" id="ai-bottom-sheet">
                <div class="sheet-drag-handle"></div>
                <div class="sheet-content">
                    <!-- Progress Bar (if regenerating) -->
                    <div id="ai-progress-container" class="hidden mb-4">
                         <div class="w-full bg-glass rounded-full h-1 overflow-hidden">
                            <div id="re-analysis-progress" class="bg-accent h-1 transition-all duration-300" style="width: 0%"></div>
                         </div>
                         <p class="text-xs text-center mt-1 text-accent">Haciendo magia...</p>
                    </div>

                    <div class="sidebar-section">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="h3 !mb-0">Análisis Gemini</h3>
                             <!-- Re-analyze mini button -->
                             <button id="btn-regenerate-ai" class="text-xs text-accent hover:underline flex items-center gap-1">
                                <i class="ph-fill ph-arrows-clockwise"></i> Actualizar
                             </button>
                        </div>
                        
                         <div class="ai-card compact">
                            <p class="text-sm font-medium text-white">${img.aiAnalysis?.summary || img.summary || "Sin análisis previo."}</p>
                            ${img.aiAnalysis?.legalBasis ? `<p class="text-xs text-muted mt-2 border-t border-glass pt-2">⚖️ ${img.aiAnalysis.legalBasis}</p>` : ''}
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 my-4">
                        <div class="detail-box">
                            <span class="label text-xs uppercase tracking-wider text-muted">Tipo</span>
                            <span class="value font-bold text-white">${img.aiAnalysis?.type || img.type || "N/A"}</span>
                        </div>
                        <div class="detail-box">
                            <span class="label text-xs uppercase tracking-wider text-muted">Vence</span>
                            <span class="value font-bold ${img.aiAnalysis?.days > 0 ? 'text-danger' : 'text-success'}">
                                ${img.aiAnalysis?.deadline || img.deadline || 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <h3 class="h3 mb-2">Sugerencia de Actuación</h3>
                        <div class="next-action-card">
                            <i class="ph-fill ph-lightbulb text-yellow-400 text-xl"></i>
                            <div>
                                <p class="text-sm font-medium text-white">${img.aiAnalysis?.nextAction || img.nextAction || "Sin sugerencia disponible."}</p>
                                <p class="text-xs text-muted mt-1">Sugerencia basada en análisis procesal.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!--Desktop Only Toolbar(Legacy / Fallback)-- >
        <div class="desktop-toolbar hidden md:flex">
            <button id="zoom-out" class="btn-icon"><i class="ph ph-minus"></i></button>
            <span id="zoom-level" class="mx-2 text-white">100%</span>
            <button id="zoom-in" class="btn-icon"><i class="ph ph-plus"></i></button>
        </div>
        </div >
        `;

}

function bindEvents(modal) {
    const imgWrapper = document.getElementById('image-wrapper');
    const activeImg = document.getElementById('active-image');

    // Cleanup function to remove global listeners
    const cleanup = () => {
        if (currentKeydownHandler) {
            window.removeEventListener('keydown', currentKeydownHandler);
            currentKeydownHandler = null;
        }
    };

    // Close
    document.getElementById('close-viewer').onclick = () => {
        cleanup();
        modal.classList.add('hidden');
    };

    // Mobile Actions
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.onclick = async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: activeImg.alt,
                        text: 'Expediente Legal',
                        url: activeImg.src
                    });
                } catch (err) {
                    console.error("Share failed:", err);
                }
            } else {
                navigator.clipboard.writeText(activeImg.src);
                alert("Enlace copiado al portapapeles");
            }
        };
    }

    const btnDownload = document.getElementById('btn-download');
    if (btnDownload) {
        btnDownload.onclick = () => {
            const a = document.createElement('a');
            a.href = activeImg.src;
            a.download = `documento_${ currentImageId }.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    }

    const btnInfo = document.getElementById('btn-info');
    const bottomSheet = document.getElementById('ai-bottom-sheet');
    if (btnInfo && bottomSheet) {
        btnInfo.onclick = () => {
            bottomSheet.classList.toggle('active');
            // Toggle icon visual state if needed
            btnInfo.classList.toggle('active-btn');
        };
        
        // Close sheet when clicking handle
        const handle = bottomSheet.querySelector('.sheet-drag-handle');
        if (handle) {
            handle.onclick = () => bottomSheet.classList.remove('active');
        }
    }

    // Zoom
    const updateTransform = () => {
        activeImg.style.transform = `translate(${ translateX }px, ${ translateY }px) scale(${ zoomLevel })`;
        document.getElementById('zoom-level').innerText = `${ Math.round(zoomLevel * 100) }% `;
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
        if (imgWrapper) imgWrapper.style.cursor = 'default';
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
    // Remove existing listener if any (safety check)
    if (currentKeydownHandler) {
        window.removeEventListener('keydown', currentKeydownHandler);
    }

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
        < button class="gallery-nav-btn prev" > <i class="ph ph-caret-left"></i></button >
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

    // AI Re-analysis
    const btnRegen = document.getElementById('btn-regenerate-ai');
    if (btnRegen) {
        btnRegen.onclick = async () => {
            const btnContent = btnRegen.innerHTML;
            btnRegen.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Analizando...';
            btnRegen.disabled = true;

            try {
                const { AIAnalysisService } = await import('../services/ai_service.js');
                const { getCase, updateCase } = await import('../store.js');

                // Simulate File object from existing data needed for heuristics
                const mockFile = { name: (activeImg.src.split('/').pop() || "Documento Desconocido") + ".jpg" };
                // Or better, use the img name from store
                const c = getCase(currentCaseId);
                const img = c.images.find(i => i.id === currentImageId);

                if (img) {
                    // Fetch the actual image data as Blob to send to Gemini
                    const response = await fetch(img.url);
                    const blob = await response.blob();

                    // Reconstruct a File-like object
                    const fileToAnalyze = new File([blob], img.name, { type: blob.type });

                    const result = await AIAnalysisService.analyzeDocument(fileToAnalyze, (percent) => {
                        btnRegen.innerHTML = `< i class="ph ph-scan" ></i > Analizando... ${ percent }% `;
                    });

                    // Update Store
                    img.aiAnalysis = result;
                    // Also update legacy fields for consistency
                    img.summary = result.summary;
                    img.type = result.type;
                    img.deadline = result.deadline;
                    img.nextAction = result.nextAction;

                    await updateCase(currentCaseId, { images: c.images });

                    // Re-render
                    renderContent(modal);
                    bindEvents(modal); // Re-bind because innerHTML replaced
                }
            } catch (e) {
                console.error(e);
                alert('Error en análisis');
                btnRegen.innerHTML = btnContent;
                btnRegen.disabled = false;
            }
        };
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
