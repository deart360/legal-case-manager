import { getCase } from '../store.js';

// Global Viewer State
let currentCaseId = null;
let currentImageId = null;
let currentMode = 'case'; // 'case' or 'promotion'
let zoomLevel = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;
let currentKeydownHandler = null;

export async function showImageViewer(caseId, imgId, mode = 'case') {
    const modal = document.getElementById('image-viewer-modal');
    currentCaseId = caseId;
    currentImageId = imgId;
    currentMode = mode;

    // Reset Zoom/Pan
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;

    // Zoom Helper
    window.adjustZoom = (delta) => {
        zoomLevel = Math.min(Math.max(0.5, zoomLevel + delta), 4);
        const img = document.getElementById('active-image');
        if (img) img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
        const label = document.getElementById('zoom-level');
        if (label) label.innerText = `${Math.round(zoomLevel * 100)}%`;
    };

    // Annex Execution Helper
    window.executeAnnex = async (targetCaseId) => {
        if (!window.pendingPromoAnnexId) return;
        if (confirm("¿Confirmar anexo a este expediente?")) {
            const { movePromotionToCase } = await import('../store.js');
            await movePromotionToCase(window.pendingPromoAnnexId, targetCaseId);
            alert("✅ ¡Documento Anexado Exitosamente!");
            document.getElementById('image-viewer-modal').classList.add('hidden');
            // Refresh Dashboard if needed? Store updates usually reactive or user will reload.
            // Dispatch event to be safe
            window.dispatchEvent(new CustomEvent('promotions-updated'));
            window.dispatchEvent(new CustomEvent('cases-updated'));
        }
    };

    // Define Global Action Handler safely
    window.handleViewerAction = async (action) => {
        console.log("Viewer Action Triggered:", action);

        // Dynamic imports for logic
        const { getPromotions, getCase, deletePromotion, getCases } = await import('../store.js');

        let img;
        if (currentMode === 'promotion') {
            img = getPromotions().find(p => p.id === currentImageId);
        } else {
            const c = getCase(currentCaseId);
            img = c?.images.find(i => i.id === currentImageId);
        }

        if (!img) return;

        switch (action) {
            case 'annex': // Promotion: Annex
                if (currentMode === 'promotion') {
                    window.pendingPromoAnnexId = currentImageId;
                    const overlay = document.getElementById('case-selector-overlay');
                    const list = document.getElementById('case-selector-list');

                    if (overlay && list) {
                        try {
                            if (typeof getCases !== 'function') throw new Error("getCases not imported");
                            const cases = getCases();

                            if (cases.length === 0) {
                                alert("No hay expedientes disponibles.");
                                return;
                            }

                            list.innerHTML = cases.map(c => `
                                <div class="p-4 bg-gray-800 rounded-lg border border-white/10 hover:bg-gray-700 cursor-pointer flex justify-between items-center transition-colors"
                                     onclick="window.executeAnnex('${c.id}')">
                                    <div>
                                        <h4 class="font-bold text-sm text-white">${c.expediente}</h4>
                                        <p class="text-xs text-muted">${c.court || 'Juzgado'} • ${c.actor}</p>
                                    </div>
                                    <div class="bg-white/10 p-2 rounded-full">
                                        <i class="ph-bold ph-plus text-accent-gold"></i>
                                    </div>
                                </div>
                             `).join('');

                            overlay.classList.remove('hidden');
                        } catch (e) {
                            console.error("Annex Error:", e);
                            alert("Error al cargar expedientes: " + e.message);
                        }
                    } else {
                        alert("Error UI: Componentes de selección no encontrados.");
                    }
                }
                break;

            case 'date':
                // User Request: Use Upload/System Date as Primary (Avoid AI confusion)
                let d = 'No detectada';
                if (img.date) {
                    // Parse ISO (e.g. 2025-12-08) and force local timezone handling or UTC? 
                    // Usually ISO from input type="date" is YYYY-MM-DD. 
                    // If splitting by T, we might get UTC issue. Better to construct explicitly if needed.
                    // But store.js uses T encoded. Let's start simple.
                    const dateObj = new Date(img.date);
                    d = dateObj.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    // Capitalize first letter of day
                    d = d.charAt(0).toUpperCase() + d.slice(1);
                } else if (img.aiAnalysis?.filingDate) {
                    d = img.aiAnalysis.filingDate + " (AI)";
                }
                alert(`📅 Fecha de Presentación (Subida): ${d}`);
                break;

            case 'answer':
                // Logic to mark as answered
                if (confirm("¿Marcar como contestado? Se borrará de pendientes.")) {
                    deletePromotion(currentImageId);
                    document.getElementById('image-viewer-modal').classList.add('hidden');
                }
                break;

            case 'share':
                if (navigator.share) {
                    navigator.share({ title: img.name, text: 'Documento Legal', url: img.url }).catch(console.error);
                } else {
                    alert("Tu navegador no soporta compartir nativo.");
                }
                break;

            case 'download':
                const link = document.createElement('a');
                link.href = img.url;
                link.download = img.name || 'documento.jpg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                break;

            case 'info':
                const sheet = document.getElementById('ai-bottom-sheet');
                if (sheet) sheet.classList.toggle('active');
                break;

            case 'delete':
                if (confirm('¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer.')) {
                    if (currentMode === 'promotion') {
                        deletePromotion(currentImageId);
                    }
                    // Close viewer
                    document.getElementById('image-viewer-modal').classList.add('hidden');
                }
                break;

            case 'reanalyze':
                if (!confirm("¿Re-analizar este documento con la IA?")) return;

                const btn = document.querySelector(`button[onclick *= "'reanalyze'"]`);
                const originalContent = btn ? btn.innerHTML : '';
                if (btn) btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> ...';

                try {
                    const { AIAnalysisService } = await import('../services/ai_service.js');
                    // Fetch image as blob
                    const response = await fetch(img.url);
                    const blob = await response.blob();
                    const file = new File([blob], img.name || "doc.jpg", { type: blob.type });

                    const result = await AIAnalysisService.analyzePromotion(file);

                    // Update Object
                    img.aiAnalysis = result;

                    // Persist Update
                    const { updatePromotion, appData, saveData } = await import('../store.js');
                    if (updatePromotion) {
                        updatePromotion(currentImageId, { aiAnalysis: result });
                    } else if (saveData) {
                        saveData(); // Fallback: Assume img modification via reference worked
                    }

                    // Re-render
                    await renderContent(document.getElementById('image-viewer-modal'));

                    // Open Sheet
                    const sheet = document.getElementById('ai-bottom-sheet');
                    if (sheet) sheet.classList.add('active');

                    alert("✅ Análisis actualizado: " + (result._meta?.model || "Gemini"));

                } catch (err) {
                    console.error('Reanalyze failed', err);
                    alert("Error: " + err.message);
                    if (btn) btn.innerHTML = originalContent;
                }
                break;
        }
    };

    await renderContent(modal); // Wait for DOM
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
                <!-- Floating Fallback Close (For Desktop issues) -->
                <div class="floating-close-btn" onclick="document.getElementById('image-viewer-modal').classList.add('hidden')">
                    <i class="ph-bold ph-arrow-left text-white"></i>
                </div>
                
                <div class="viewer-top-bar">
                    <button id="close-viewer" class="btn-icon transparent"><i class="ph-bold ph-arrow-left"></i></button>
                    <span class="file-title truncate px-2 text-sm md:text-base">${img.name || 'Documento'}</span>
                    <div class="spacer"></div>
                </div>

            <!-- Main Image Area -->
            <div class="viewer-main">
                <div class="image-wrapper" id="image-wrapper">
                    <img src="${img.url}" id="active-image" alt="Documento" draggable="false">
                </div>
            </div>

            <!-- Floating Bottom Bar (Context Aware) -->
            <div class="mobile-bottom-bar" onclick="event.stopPropagation()">
                ${currentMode === 'promotion' ? `
                    <!-- PROMOTION MODE ACTIONS -->
                    <button class="action-btn" onclick="window.handleViewerAction('date')">
                        <i class="ph ph-calendar-blank"></i>
                        <span>Ver Fecha</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('annex')">
                        <i class="ph ph-folder-plus text-accent"></i>
                        <span>Anexar</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('info')">
                        <i class="ph ph-sparkle text-accent-gold"></i>
                        <span>IA Reporte</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('answer')">
                        <i class="ph ph-check-circle text-green-500"></i>
                        <span>Contestado</span>
                    </button>
                ` : `
                    <!-- STANDARD CASE MODE ACTIONS -->
                    <button class="action-btn" onclick="window.handleViewerAction('share')">
                        <i class="ph ph-share-network"></i>
                        <span>Compartir</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('download')">
                        <i class="ph ph-download-simple"></i>
                        <span>Descargar</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('date')">
                        <i class="ph ph-calendar-blank"></i>
                        <span>Fecha</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('info')">
                        <i class="ph ph-info"></i>
                        <span>Info</span>
                    </button>
                    <div class="divider-v"></div>
                    <button class="action-btn" onclick="window.handleViewerAction('delete')">
                        <i class="ph ph-trash text-red-400"></i>
                        <span>Borrar</span>
                    </button>
                `}
            </div>

            <!-- Bottom Sheet (AI Info) - For BOTH modes -->
            <div class="bottom-sheet" id="ai-bottom-sheet">
                <div class="sheet-drag-handle" onclick="document.getElementById('ai-bottom-sheet').classList.remove('active')"></div>
                <div class="sheet-content">
                    <div class="sidebar-section">
                        <div class="flex justify-between items-center mb-2">
                             <div class="flex items-center gap-2">
                                <h3 class="h3 !mb-0 text-sm">Análisis IA</h3>
                                <span class="text-[0.65rem] font-mono uppercase px-1.5 py-0.5 rounded border ${img.aiAnalysis?._meta?.model?.includes('gemini-1.5')
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-purple-500/10 border-purple-500/30 text-accent-gold'
        }">
                                    ${img.aiAnalysis?._meta?.model || 'Gemini 3.0'}
                                </span>
                             </div>
                             <button onclick="window.handleViewerAction('reanalyze')" class="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors px-2 py-1 hover:bg-white/5 rounded">
                                <i class="ph ph-arrows-clockwise"></i> Reanalizar
                            </button>
                        </div>
                        <div class="ai-card compact">
                            <h4 class="text-accent-gold font-bold text-sm mb-1">${img.aiAnalysis?.concept || img.type || "Documento"}</h4>
                            <p class="text-sm font-medium text-white mb-3">${img.aiAnalysis?.summary || img.summary || "Sin análisis previo."}</p>
                            
                            <!-- Context Data -->
                            <div class="space-y-2 mb-3 bg-white/5 p-2 rounded-lg border border-white/10">
                                <div class="flex justify-between items-center text-xs">
                                    <span class="text-muted"><i class="ph-bold ph-bank"></i> Juzgado</span>
                                    <span class="text-white font-medium text-right max-w-[60%] truncate">${img.aiAnalysis?.court || "No identificado"}</span>
                                </div>
                                <div class="flex justify-between items-center text-xs">
                                    <span class="text-muted"><i class="ph-bold ph-folder"></i> Exp.</span>
                                    <span class="text-white font-medium text-right">${img.aiAnalysis?.caseNumber || "No identificado"}</span>
                                </div>
                                <div class="flex justify-between items-center text-xs">
                                    <span class="text-muted"><i class="ph-bold ph-scales"></i> Materia</span>
                                    <span class="text-white font-medium text-right">${img.aiAnalysis?.materia || "No identificada"}</span>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2 mt-2">
                                <div class="detail-box">
                                    <span class="text-xs text-muted">Fecha Presentación</span>
                                    <span class="font-mono text-white">${img.aiAnalysis?.filingDate || img.date || "N/A"}</span>
                                </div>
                                <div class="detail-box">
                                    <span class="text-xs text-muted">Término (Días)</span>
                                    <span class="font-mono text-red-400 font-bold">${img.aiAnalysis?.days || "0"}</span>
                                </div>
                            </div>

                            ${img.aiAnalysis?.legalBasis ? `<p class="text-xs text-muted mt-2 border-t border-glass pt-2">⚖️ ${img.aiAnalysis.legalBasis}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <!--Case Selection Overlay(Promotions Mode)-- >
             <div id="case-selector-overlay" class="hidden absolute inset-0 bg-black/95 z-50 p-4 flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="h3 text-white">Seleccionar Expediente</h3>
                    <button onclick="document.getElementById('case-selector-overlay').classList.add('hidden')" class="btn-icon"><i class="ph ph-x"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto space-y-2" id="case-selector-list">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!--Desktop Only Toolbar(Legacy / Fallback)-- >
                            <div class="desktop-toolbar hidden md:flex">
                                <button id="zoom-out" class="btn-icon" onclick="window.adjustZoom(-0.2)"><i class="ph ph-minus"></i></button>
                                <span id="zoom-level" class="mx-2 text-white">100%</span>
                                <button id="zoom-in" class="btn-icon" onclick="window.adjustZoom(0.2)"><i class="ph ph-plus"></i></button>
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
                            < div class= "flex justify-between" >
                            <span class="font-bold text-white text-base">${c.expediente || 'S/N'}</span>
                                     ${c.juicio ? `<span class="text-xs text-accent/80 border border-accent/20 px-1 rounded">${c.juicio}</span>` : ''}
                                 </div >
                                 <span class="text-sm text-gray-300 font-medium">${c.actor} vs ${c.demandado}</span>
                                 <span class="text-xs text-muted truncate">${c.juzgado || 'Juzgado desconocido'}</span>
                              `;
                            item.onclick = async () => {
                                if (confirm(`¿Anexar a ${c.expediente} ? `)) {
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
        document.getElementById('zoom-level').innerText = `${Math.round(zoomLevel * 100)} % `;
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
                        btnRegen.innerHTML = `< i class= "ph ph-scan" ></i > Analizando...${percent} % `;
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
