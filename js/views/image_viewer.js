import { getCase } from '../store.js';

// Global Viewer State
let currentCaseId = null;
let currentImageId = null;
let currentMode = 'case'; // 'case' or 'promotion'
let zoomLevel = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let currentKeydownHandler = null;

export function showImageViewer(caseId, imgId, mode = 'case') {
    const modal = document.getElementById('image-viewer-modal');
    currentCaseId = caseId;
    currentImageId = imgId;
    currentMode = mode;

    // Reset Zoom/Pan
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;

    renderContent(modal);
    modal.classList.remove('hidden');

    // Bind Events
    bindEvents(modal);
}

async function renderContent(modal) {
    let img;

    // Fetch logic based on mode
    if (currentMode === 'promotion') {
        const { getPromotions } = await import('../store.js');
        const promotions = getPromotions();
        img = promotions.find(p => p.id === currentImageId);
    } else {
        const c = getCase(currentCaseId);
        img = c ? c.images.find(i => i.id === currentImageId) : null;
    }

    if (!img) return;

    modal.innerHTML = `
        <div class="viewer-container" oncontextmenu="return false;">
            <!-- Viewer Top Bar (Overlay) -->
            <div class="viewer-top-bar">
                 <button id="close-viewer" class="btn-icon transparent flex items-center gap-1 px-3 py-1.5 bg-black/20 rounded-full backdrop-blur-sm hover:bg-black/40 transition-colors">
                    <i class="ph-bold ph-arrow-left text-lg"></i>
                    <span class="text-sm font-medium">Atrás</span>
                 </button>
                 <span class="file-title text-sm truncate">${img.name}</span>
                 <div class="spacer"></div> <!-- Balance layout -->
            </div>

            <!-- Main Image Area -->
            <div class="viewer-main">
                <div class="image-wrapper" id="image-wrapper">
                    <img src="${img.url}" id="active-image" alt="Documento" draggable="false">
                </div>
            </div>

            <!-- Floating Bottom Bar (Context Aware) -->
            <div class="mobile-bottom-bar">
                ${currentMode === 'promotion' ? `
                    <!-- PROMOTION MODE ACTIONS -->
                    <button id="btn-promo-date" class="action-btn">
                        <i class="ph ph-calendar-blank"></i>
                        <span>Ver Fecha</span>
                    </button>
                    <div class="divider-v"></div>
                    <button id="btn-promo-annex" class="action-btn">
                        <i class="ph ph-folder-plus text-accent"></i>
                        <span>Anexar</span>
                    </button>
                    <div class="divider-v"></div>
                    <button id="btn-promo-answered" class="action-btn">
                        <i class="ph ph-check-circle text-green-500"></i>
                        <span>Contestado</span>
                    </button>
                ` : `
                    <!-- STANDARD CASE MODE ACTIONS -->
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
                    <button id="btn-date" class="action-btn">
                        <i class="ph ph-calendar-blank"></i>
                        <span>Fecha</span>
                    </button>
                    <div class="divider-v"></div>
                    <button id="btn-info" class="action-btn">
                        <i class="ph ph-info"></i>
                        <span>Detalles IA</span>
                    </button>
                `}
            </div>

            <!-- Bottom Sheet (AI Info) - Only for CASE mode -->
            ${currentMode === 'case' ? `
            <div class="bottom-sheet" id="ai-bottom-sheet">
                <div class="sheet-drag-handle"></div>
                <div class="sheet-content">
                    <!-- ... AI Content ... -->
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
                     <!-- ... Other AI details ... -->
                </div>
            </div>
            ` : ''} 
            
            <!-- Case Selection Overlay (Promotions Mode) -->
             <div id="case-selector-overlay" class="hidden absolute inset-0 bg-black/90 z-40 p-4 flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="h3 text-white">Seleccionar Expediente</h3>
                    <button id="close-case-selector" class="btn-icon"><i class="ph ph-x"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto" id="case-selector-list">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!-- Desktop Only Toolbar (Legacy/Fallback) -->
            <div class="desktop-toolbar hidden md:flex">
                 <button id="zoom-out" class="btn-icon"><i class="ph ph-minus"></i></button>
                 <span id="zoom-level" class="mx-2 text-white">100%</span>
                 <button id="zoom-in" class="btn-icon"><i class="ph ph-plus"></i></button>
            </div>
        </div>
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
            a.download = `documento_${currentImageId}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    }

    // Toast Helper
    const showToast = (msg) => {
        let toast = document.getElementById('viewer-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'viewer-toast';
            toast.className = 'absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium transition-opacity opacity-0 pointer-events-none z-50 border border-white/10 shadow-xl';
            document.querySelector('.viewer-container').appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 3000);
    };

    // --- PROMOTION MODE HANDLERS ---
    const btnPromoDate = document.getElementById('btn-promo-date');
    if (btnPromoDate) {
        btnPromoDate.onclick = async () => {
            const { getPromotions } = await import('../store.js');
            const promotions = getPromotions();
            const img = promotions.find(p => p.id === currentImageId);
            const dateStr = img?.aiAnalysis?.filingDate || 'Fecha desconocida';
            showToast(`📅 Presentado: ${dateStr}`);
        };
    }

    const btnPromoAnswered = document.getElementById('btn-promo-answered');
    if (btnPromoAnswered) {
        btnPromoAnswered.onclick = async () => {
            if (confirm("¿Marcar como contestado?\nSe eliminará la foto de pendientes, pero el evento en la agenda se conservará.")) {
                const { deletePromotion } = await import('../store.js');
                deletePromotion(currentImageId);
                showToast("✅ Contestado. Foto eliminada.");
                setTimeout(() => document.getElementById('close-viewer').click(), 1000); // Close after 1s
            }
        };
    }

    const btnPromoAnnex = document.getElementById('btn-promo-annex');
    const caseOverlay = document.getElementById('case-selector-overlay');
    const caseList = document.getElementById('case-selector-list');
    const closeOverlay = document.getElementById('close-case-selector');

    if (closeOverlay && caseOverlay) {
        closeOverlay.onclick = () => caseOverlay.classList.add('hidden');
    }

    if (btnPromoAnnex) {
        btnPromoAnnex.onclick = async () => {
            const { getPromotions, movePromotionToCase, appData } = await import('../store.js');

            // Populate List
            if (caseList) {
                caseList.innerHTML = '';
                let hasCases = false;

                appData.states.forEach(state => {
                    // Check if state has any cases in any subject
                    const stateHasCases = state.subjects.some(sub => sub.cases.length > 0);
                    if (!stateHasCases) return;

                    // 1. State Header
                    const stateHeader = document.createElement('div');
                    stateHeader.className = 'sticky top-0 bg-gray-900 text-accent font-bold px-3 py-2 text-sm uppercase tracking-wide border-b border-white/20 z-10';
                    stateHeader.innerText = state.name;
                    caseList.appendChild(stateHeader);

                    state.subjects.forEach(subject => {
                        if (subject.cases.length === 0) return;

                        // 2. Subject Sub-header
                        const subjectHeader = document.createElement('div');
                        subjectHeader.className = 'bg-gray-800 text-white/70 font-semibold px-4 py-1 text-xs uppercase border-b border-white/5';
                        subjectHeader.innerText = subject.name;
                        caseList.appendChild(subjectHeader);

                        // 3. Case Items
                        subject.cases.forEach(caseId => {
                            const c = appData.cases[caseId];
                            if (!c) return;
                            hasCases = true;

                            const item = document.createElement('div');
                            item.className = 'p-3 pl-6 border-b border-white/10 hover:bg-white/5 cursor-pointer flex flex-col gap-1';
                            item.innerHTML = `
                                <div class="flex justify-between">
                                    <span class="font-bold text-white text-base">${c.expediente || 'S/N'}</span>
                                    ${c.juicio ? `<span class="text-xs text-accent/80 border border-accent/20 px-1 rounded">${c.juicio}</span>` : ''}
                                </div>
                                <span class="text-sm text-gray-300 font-medium">${c.actor} vs ${c.demandado}</span>
                                <span class="text-xs text-muted truncate">${c.juzgado || 'Juzgado desconocido'}</span>
                             `;
                            item.onclick = async () => {
                                if (confirm(`¿Anexar a ${c.expediente}?`)) {
                                    movePromotionToCase(currentImageId, c.id);
                                    caseOverlay.classList.add('hidden');
                                    showToast("📂 Anexado correctamente.");
                                    setTimeout(() => document.getElementById('close-viewer').click(), 1000);
                                }
                            };
                            caseList.appendChild(item);
                        });
                    });
                });

                if (!hasCases) {
                    caseList.innerHTML = '<p class="text-muted text-center mt-12"><i class="ph ph-folder-notch-open text-3xl mb-2 opacity-50"></i><br>No hay expedientes registrados.</p>';
                }
            }

            // Show Overlay
            if (caseOverlay) caseOverlay.classList.remove('hidden');
        };
    }

    // --- STANDARD MODE HANDLERS ---
    const btnDate = document.getElementById('btn-date');
    if (btnDate) {
        btnDate.onclick = () => {
            // Access global currentCaseId/currentImageId if needed, but better to check the active image element or store
            // Since we are inside the module where renderContent runs, we relies that 'currentCaseId' is available. 
            // To be safe, we'll fetch from store synchrounously if possible or assume data is ready,
            // BUT simpler: valid 'img' was used to render.
            // Let's re-fetch safely.
            import('../store.js').then(({ getCase }) => {
                const c = getCase(currentCaseId);
                const img = c?.images.find(i => i.id === currentImageId);
                const dateStr = img?.date || 'Fecha desconocida';
                showToast(`📅 Fecha Anexo: ${dateStr}`);
            });
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
        activeImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
        document.getElementById('zoom-level').innerText = `${Math.round(zoomLevel * 100)}% `;
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

    // Gallery Mode Toggle (Removed per user request)

    // Keyboard Navigation
    if (currentKeydownHandler) {
        window.removeEventListener('keydown', currentKeydownHandler);
    }

    // Simplified keyboard navigation (just escape to close)
    currentKeydownHandler = (e) => {
        if (e.key === 'Escape') {
            document.getElementById('close-viewer').click();
        }
    };
    window.addEventListener('keydown', currentKeydownHandler);

    // Swipe Navigation (Simple implementation)
    let touchStartX = 0;
    let touchEndX = 0;

    // imgWrapper is already defined at the top of bindEvents
    if (imgWrapper) {
        imgWrapper.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        });

        imgWrapper.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        // Always allow swipe navigation if we are just viewing
        if (touchEndX < touchStartX - swipeThreshold) {
            navigateImage(1);
        }
        if (touchEndX > touchStartX + swipeThreshold) {
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
                        btnRegen.innerHTML = `< i class="ph ph-scan" ></i > Analizando... ${percent}% `;
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
