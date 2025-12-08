import { getCase, addImageToCase, deleteImages, reorderImages } from '../store.js';
import { generateLegalPdf } from '../utils/pdf_generator.js';

export function createCaseView(caseId) {
    const container = document.createElement('div');
    container.className = 'case-view p-6';

    let isSelectionMode = false;
    let selectedImages = new Set();

    // Internal render function to allow refreshing without full reload
    const render = () => {
        const c = getCase(caseId);
        if (!c) {
            container.innerHTML = `<h2>Expediente no encontrado</h2>`;
            return;
        }

        const header = `
            <div class="case-header mb-6">
                <div class="breadcrumb text-sm text-muted mb-2">
                    <span onclick="window.history.back()" style="cursor:pointer"> Atrás </span> / ${c.expediente}
                </div>
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="h2">${c.title}</h1>
                        <p class="text-muted">${c.juzgado} • Última act: ${c.lastUpdate}</p>
                    </div>
                    <div class="case-actions flex gap-2">
                        <button class="btn-secondary ${isSelectionMode ? 'bg-accent text-white' : ''}" id="btn-manage-docs">
                            <i class="ph ph-selection-all"></i> ${isSelectionMode ? 'Cancelar' : 'Gestionar'}
                        </button>
                        <div class="w-px h-6 bg-white/10 mx-2"></div>
                        <button class="btn-icon-sm bg-glass" onclick="window.openCaseModal('', '${caseId}')" title="Editar">
                            <i class="ph ph-pencil"></i>
                        </button>
                        <button class="btn-icon-sm bg-glass text-danger" onclick="window.confirmDeleteCase('${caseId}')" title="Eliminar">
                            <i class="ph ph-trash"></i>
                        </button>
                        <div class="w-px h-6 bg-white/10 mx-2"></div>
                        <input type="file" id="file-upload-${caseId}" class="hidden" accept="image/*,application/pdf" multiple>
                        <div class="flex flex-col items-end">
                            <button class="btn-primary btn-upload-trigger" ${isSelectionMode ? 'disabled' : ''}>
                                <i class="ph ph-camera"></i> Anexar Fotos/PDF
                            </button>
                            <!-- Progress Bar Container -->
                            <div id="upload-progress-container" class="hidden w-32 mt-2">
                                <div class="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                    <div id="upload-progress-bar" class="bg-accent h-full rounded-full transition-all duration-300" style="width: 0%"></div>
                                </div>
                                <p id="upload-progress-text" class="text-xs text-right mt-1 text-muted">0%</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Selection Action Bar -->
                ${isSelectionMode ? `
                <div class="selection-bar bg-glass border border-glass p-3 rounded-lg mt-4 flex justify-between items-center animate-fade-in">
                    <span class="font-bold text-accent">${selectedImages.size} seleccionados</span>
                    <div class="flex gap-2">
                        <button class="btn-sm btn-secondary" id="btn-select-all"><i class="ph ph-check-square"></i> Todos</button>
                        <button class="btn-sm btn-secondary" id="btn-share-selection" ${selectedImages.size === 0 ? 'disabled' : ''}><i class="ph ph-share-network"></i> Compartir</button>
                        <button class="btn-sm btn-secondary" id="btn-download-selection" ${selectedImages.size === 0 ? 'disabled' : ''}><i class="ph ph-download-simple"></i> Descargar</button>
                        <button class="btn-sm btn-danger" id="btn-delete-selection" ${selectedImages.size === 0 ? 'disabled' : ''}><i class="ph ph-trash"></i> Eliminar</button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        // Image Grid
        const imagesHtml = `
            <div class="documents-grid" id="doc-grid">
                ${c.images.map(img => `
                    <div class="doc-card ${selectedImages.has(img.id) ? 'selected ring-2 ring-accent' : ''}" 
                         data-id="${img.id}"
                         onclick="${isSelectionMode ? '' : `event.stopPropagation(); window.openImage('${caseId}', '${img.id}')`}">
                        <div class="doc-preview">
                            <img src="${img.url}" alt="${img.type}" crossorigin="anonymous">
                            
                            ${isSelectionMode ? `
                            <div class="selection-overlay absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
                                <div class="checkbox ${selectedImages.has(img.id) ? 'bg-accent border-accent' : 'border-white'} w-6 h-6 rounded border-2 flex items-center justify-center transition-colors">
                                    ${selectedImages.has(img.id) ? '<i class="ph-bold ph-check text-white text-sm"></i>' : ''}
                                </div>
                            </div>
                            ` : `
                            <div class="doc-overlay">
                                <i class="ph ph-magnifying-glass-plus"></i>
                            </div>
                            `}
                        </div>
                        <div class="doc-info">
                            <span class="doc-type">${img.type}</span>
                            ${img.deadline ? `<span class="doc-status urgent"><i class="ph-fill ph-clock"></i> Vence: ${img.deadline}</span>` : ''}
                        </div>
                        <div class="doc-ai-summary">
                            <i class="ph-fill ph-sparkle text-accent"></i>
                            <span class="text-xs text-muted truncate">${img.nextAction}</span>
                        </div>
                    </div>
                `).join('')}
                
                <!-- Upload Placeholder (Hidden in selection mode) -->
                ${!isSelectionMode ? `
                <div class="doc-card upload-card">
                    <i class="ph ph-plus"></i>
                    <span>Anexar Foto</span>
                </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = header + imagesHtml;

        // Re-attach handlers
        bindHandlers(container, c);
    };

    const bindHandlers = (container, c) => {
        const fileInput = container.querySelector(`#file-upload-${caseId}`);
        const uploadBtn = container.querySelector('.btn-upload-trigger');
        const uploadCard = container.querySelector('.upload-card');
        const progressContainer = container.querySelector('#upload-progress-container');
        const progressBar = container.querySelector('#upload-progress-bar');
        const progressText = container.querySelector('#upload-progress-text');
        const btnManage = container.querySelector('#btn-manage-docs');

        // Manage Toggle
        if (btnManage) {
            btnManage.onclick = () => {
                isSelectionMode = !isSelectionMode;
                selectedImages.clear();
                render();
            };
        }

        // Selection Actions
        if (isSelectionMode) {
            // Toggle Selection Helper
            window.toggleSelection = (imgId) => {
                if (selectedImages.has(imgId)) {
                    selectedImages.delete(imgId);
                } else {
                    selectedImages.add(imgId);
                }
                render();
            };

            // Bind click events to cards for selection
            const cards = container.querySelectorAll('.doc-card');
            cards.forEach(card => {
                const id = card.getAttribute('data-id');

                // Click Handler
                card.onclick = (e) => {
                    e.stopPropagation();
                    if (id) window.toggleSelection(id);
                };

                // Long Press Handler
                let pressTimer;
                const startPress = (e) => {
                    pressTimer = setTimeout(() => {
                        // Trigger Context Menu
                        const rect = card.getBoundingClientRect();
                        // Position near the center of the card or touch point
                        const x = e.touches ? e.touches[0].clientX : e.clientX;
                        const y = e.touches ? e.touches[0].clientY : e.clientY;

                        showContextMenu(x, y, id, c);
                    }, 500); // 500ms for long press
                };

                const cancelPress = () => {
                    clearTimeout(pressTimer);
                };

                // Touch Events
                card.addEventListener('touchstart', startPress, { passive: true });
                card.addEventListener('touchend', cancelPress);
                card.addEventListener('touchmove', cancelPress);

                // Mouse Events
                card.addEventListener('mousedown', startPress);
                card.addEventListener('mouseup', cancelPress);
                card.addEventListener('mouseleave', cancelPress);
            });


            // Select All
            const btnSelectAll = container.querySelector('#btn-select-all');
            if (btnSelectAll) {
                btnSelectAll.onclick = () => {
                    if (selectedImages.size === c.images.length) {
                        selectedImages.clear();
                    } else {
                        c.images.forEach(img => selectedImages.add(img.id));
                    }
                    render();
                };
            }

            // Delete Selection
            const btnDelete = container.querySelector('#btn-delete-selection');
            if (btnDelete) {
                btnDelete.onclick = async () => {
                    if (confirm(`¿Estás seguro de eliminar ${selectedImages.size} documentos?`)) {
                        await deleteImages(caseId, Array.from(selectedImages));
                        isSelectionMode = false;
                        selectedImages.clear();
                        render();
                    }
                };
            }

            // Share Selection
            const btnShare = container.querySelector('#btn-share-selection');
            if (btnShare) {
                btnShare.onclick = () => {
                    // Show Share Modal
                    showShareModal(Array.from(selectedImages), c);
                };
            }

            // Download Selection
            const btnDownload = container.querySelector('#btn-download-selection');
            if (btnDownload) {
                btnDownload.onclick = () => {
                    showDownloadModal(Array.from(selectedImages), c);
                };
            }
        }

        // Upload Handlers (Only if not selection mode)
        if (!isSelectionMode) {
            const triggerUpload = () => fileInput.click();
            if (uploadBtn) uploadBtn.onclick = triggerUpload;
            if (uploadCard) uploadCard.onclick = triggerUpload;

            fileInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;

                // UI Feedback
                const originalText = uploadBtn.innerHTML;
                uploadBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Subiendo...';
                uploadBtn.disabled = true;

                // Show Progress Bar
                if (progressContainer) progressContainer.classList.remove('hidden');

                let newCount = 0;
                const pdfLib = window.pdfjsLib;

                for (const [index, file] of files.entries()) {
                    try {
                        if (files.length > 1) {
                            progressText.textContent = `Archivo ${index + 1}/${files.length}`;
                            progressBar.style.width = '0%';
                        }

                        const onProgress = (percent) => {
                            if (progressBar) progressBar.style.width = `${percent}%`;
                            if (progressText) progressText.textContent = `${Math.round(percent)}%`;
                        };

                        if (file.type === 'application/pdf') {
                            if (!pdfLib) throw new Error("Librería PDF no cargada");
                            progressText.textContent = "Procesando PDF...";
                            await processPdfFile(caseId, file, pdfLib, onProgress);
                            newCount++;
                        } else {
                            const result = await addImageToCase(caseId, file, onProgress);
                            if (result) newCount++;
                        }
                    } catch (err) {
                        console.error("Error en archivo " + file.name, err);
                        alert("Error procesando " + file.name + ": " + err.message);
                    }
                }

                uploadBtn.innerHTML = originalText;
                uploadBtn.disabled = false;
                if (progressContainer) progressContainer.classList.add('hidden');

                if (newCount > 0) render();
            };
        }
    };

    // Listen for AI updates
    const aiUpdateHandler = (e) => {
        if (e.detail.caseId === caseId) {
            render();
        }
    };
    window.addEventListener('case-updated', aiUpdateHandler);

    // Initial render
    render();

    return container;
}

function showContextMenu(x, y, imgId, c) {
    // Remove existing context menus
    const existing = document.querySelectorAll('.context-menu');
    existing.forEach(el => el.remove());

    const menu = document.createElement('div');
    menu.className = 'context-menu glass-card p-2 flex flex-col gap-1 animate-scale-in rounded-xl border border-white/10 shadow-xl backdrop-blur-md bg-gray-900/80';
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.zIndex = '1000';
    menu.style.minWidth = '180px';

    menu.innerHTML = `
        <button class="btn-ghost w-full justify-start text-sm hover:bg-white/10 rounded-lg p-2 transition-colors text-gray-200" id="ctx-share">
            <i class="ph ph-share-network text-accent text-lg"></i> Compartir
        </button>
        <button class="btn-ghost w-full justify-start text-sm hover:bg-white/10 rounded-lg p-2 transition-colors text-gray-200" id="ctx-download">
            <i class="ph ph-download-simple text-accent text-lg"></i> Descargar
        </button>
        <button class="btn-ghost w-full justify-start text-sm hover:bg-white/10 rounded-lg p-2 transition-colors text-gray-200" id="ctx-move">
            <i class="ph ph-arrows-down-up text-accent text-lg"></i> Mover
        </button>
        <div class="h-px bg-white/10 my-1 mx-2"></div>
        <button class="btn-ghost w-full justify-start text-sm hover:bg-red-500/20 text-red-400 rounded-lg p-2 transition-colors" id="ctx-delete">
            <i class="ph ph-trash text-lg"></i> Eliminar
        </button>
    `;

    document.body.appendChild(menu);

    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 10}px`;

    // Actions
    menu.querySelector('#ctx-share').onclick = () => {
        showShareModal([imgId], c);
        menu.remove();
    };

    menu.querySelector('#ctx-download').onclick = () => {
        // Reuse the download modal logic but for single item
        showDownloadModal([imgId], c);
        menu.remove();
    };

    menu.querySelector('#ctx-delete').onclick = async () => {
        if (confirm("¿Eliminar este documento?")) {
            await deleteImages(c.id, [imgId]);
            // Refresh view (hacky but works for now, ideally dispatch event)
            const view = document.querySelector('.case-view');
            if (view) {
                // Trigger a re-render if possible, or just reload
                // Since we don't have easy access to 'render' here, we can dispatch a custom event
                window.dispatchEvent(new CustomEvent('case-updated', { detail: { caseId: c.id } }));
            }
        }
        menu.remove();
    };

    menu.querySelector('#ctx-move').onclick = () => {
        // Show sub-menu or just simple Up/Down actions
        // For simplicity, let's replace the menu content with Move options
        menu.innerHTML = `
            <div class="p-2 text-xs font-bold text-center border-b border-white/10 mb-1 text-muted uppercase tracking-wider">Mover</div>
            <button class="btn-ghost w-full justify-start text-sm hover:bg-white/10 rounded-lg p-2 transition-colors text-gray-200" id="ctx-move-up">
                <i class="ph ph-arrow-up text-accent"></i> Subir
            </button>
            <button class="btn-ghost w-full justify-start text-sm hover:bg-white/10 rounded-lg p-2 transition-colors text-gray-200" id="ctx-move-down">
                <i class="ph ph-arrow-down text-accent"></i> Bajar
            </button>
        `;

        menu.querySelector('#ctx-move-up').onclick = async () => {
            await moveImage(c.id, imgId, -1);
            menu.remove();
        };

        menu.querySelector('#ctx-move-down').onclick = async () => {
            await moveImage(c.id, imgId, 1);
            menu.remove();
        };
    };

    // ... (rest of function) ...
}



function showShareModal(selectedIds, c) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="modal-content glass-card p-6 w-full max-w-md animate-scale-in">
            <div class="modal-header mb-4 flex justify-between items-center">
                <h3 class="h3">Compartir Documentos</h3>
                <button class="btn-icon-sm" id="close-share"><i class="ph ph-x"></i></button>
            </div>
            <p class="text-muted mb-4">Has seleccionado <strong>${selectedIds.length}</strong> documentos.</p>
            
            <div class="flex flex-col gap-3">
                <button class="btn-primary w-full justify-between" id="share-pdf">
                    <span class="flex items-center gap-2"><i class="ph ph-file-pdf"></i> Generar PDF (Oficio)</span>
                    <i class="ph ph-caret-right"></i>
                </button>
                <button class="btn-secondary w-full justify-between" id="share-imgs">
                    <span class="flex items-center gap-2"><i class="ph ph-images"></i> Imágenes Sueltas</span>
                    <i class="ph ph-caret-right"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close Handler
    const close = () => {
        modal.remove();
    };
    modal.querySelector('#close-share').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    // PDF Handler
    modal.querySelector('#share-pdf').onclick = async () => {
        const btn = modal.querySelector('#share-pdf');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Generando...';
        btn.disabled = true;

        try {
            const images = c.images.filter(img => selectedIds.includes(img.id));
            const pdfBlob = await generateLegalPdf(images);
            const url = URL.createObjectURL(pdfBlob);

            // Open in new tab
            window.open(url, '_blank');
            close();
        } catch (e) {
            console.error(e);
            alert("Error generando PDF: " + e.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    };

    // Share Images Handler
    modal.querySelector('#share-imgs').onclick = async () => {
        const btn = modal.querySelector('#share-imgs');
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Preparando...';
        btn.disabled = true;

        try {
            const images = c.images.filter(img => selectedIds.includes(img.id));

            // If Web Share API is supported and we have 1 image (or multiple if supported)
            if (navigator.share && navigator.canShare) {
                // Try to share as files
                const filesArray = [];
                for (const img of images) {
                    const fetchUrl = `${img.url}${img.url.includes('?') ? '&' : '?'}t=${Date.now()}`;
                    const blob = await fetch(fetchUrl, { mode: 'cors', cache: 'no-store' }).then(r => r.blob());
                    const file = new File([blob], `${img.type || 'imagen'}.jpg`, { type: blob.type });
                    filesArray.push(file);
                }

                if (navigator.canShare({ files: filesArray })) {
                    await navigator.share({
                        files: filesArray,
                        title: 'Documentos del Expediente',
                        text: `Compartiendo ${images.length} documentos.`
                    });
                    close();
                    return;
                }
            }

            // Fallback: Download one by one (or open in new tabs)
            // For mobile, opening in new tab is often better if share fails.
            // But let's try to trigger download.
            for (const img of images) {
                const link = document.createElement('a');
                link.href = img.url;
                link.download = `${img.type || 'documento'}.jpg`;
                link.target = '_blank'; // Fallback
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Small delay to prevent browser blocking multiple downloads
                await new Promise(r => setTimeout(r, 500));
            }
            close();

        } catch (e) {
            console.error(e);
            alert("Error compartiendo imágenes: " + e.message);
            btn.innerHTML = originalContent; // This variable might not be in scope, fix below
            btn.disabled = false;
        }
    };
}

// Helper to move image
async function moveImage(caseId, imgId, direction) {
    const c = getCase(caseId);
    if (!c || !c.images) return;

    const idx = c.images.findIndex(i => i.id === imgId);
    if (idx === -1) return;

    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= c.images.length) return;

    // Swap
    const temp = c.images[idx];
    c.images[idx] = c.images[newIdx];
    c.images[newIdx] = temp;

    // Save
    const newOrder = c.images.map(i => i.id);
    await reorderImages(caseId, newOrder);

    // Refresh
    window.dispatchEvent(new CustomEvent('case-updated', { detail: { caseId } }));
}

async function processPdfFile(caseId, file, pdfLib, onProgress) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfLib.getDocument(arrayBuffer).promise;

        // Iterate through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            // Update progress for PDF processing steps
            if (onProgress) onProgress((i / pdf.numPages) * 50); // First 50% is processing

            const page = await pdf.getPage(i);

            // Set scale for good quality
            const viewport = page.getViewport({ scale: 1.5 });

            // Create a canvas to render the page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert canvas to Blob (Image)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

            // Add metadata
            // Create a File object from Blob to preserve name property for store
            const imageFile = new File([blob], `${file.name.replace('.pdf', '')} - Pág ${i}.jpg`, { type: 'image/jpeg' });

            // Upload the image
            // We pass a sub-progress callback for the upload part (remaining 50%)
            await addImageToCase(caseId, imageFile, (uploadPercent) => {
                if (onProgress) {
                    // Map upload 0-100 to overall 50-100 for this page
                    // This is a simplification; ideally we track total pages.
                    // For now, let's just show the upload progress of the current page as the main progress
                    onProgress(uploadPercent);
                }
            });
        }
    } catch (e) {
        console.error("Error procesando PDF:", e);
        throw new Error("No se pudo leer el PDF. Asegúrate de que no esté corrupto o protegido con contraseña.");
    }
}

function showDownloadModal(selectedIds, c) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="modal-content glass-card p-6 w-full max-w-md animate-scale-in rounded-xl border border-white/10 shadow-xl backdrop-blur-md bg-gray-900/90">
            <div class="modal-header mb-4 flex justify-between items-center">
                <h3 class="h3 text-white">Descargar Documentos</h3>
                <button class="btn-icon-sm hover:bg-white/10 rounded-full p-1 transition-colors" id="close-download"><i class="ph ph-x text-white"></i></button>
            </div>
            <p class="text-muted mb-6 text-sm">Elige el formato para descargar <strong>${selectedIds.length}</strong> documento(s).</p>
            
            <div class="flex flex-col gap-3">
                <button class="btn-primary w-full justify-between p-4 rounded-lg flex items-center group hover:scale-[1.02] transition-all" id="download-pdf">
                    <span class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><i class="ph ph-file-pdf text-xl"></i></div>
                        <div class="flex flex-col items-start">
                            <span class="font-bold">Como PDF (Oficio)</span>
                            <span class="text-xs text-white/70">Un solo archivo PDF</span>
                        </div>
                    </span>
                    <i class="ph ph-download-simple text-xl group-hover:translate-y-1 transition-transform"></i>
                </button>
                
                <button class="btn-secondary w-full justify-between p-4 rounded-lg flex items-center group hover:scale-[1.02] transition-all border border-white/10 hover:bg-white/5" id="download-imgs">
                    <span class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><i class="ph ph-image text-xl text-accent"></i></div>
                        <div class="flex flex-col items-start">
                            <span class="font-bold text-white">Como Imágenes</span>
                            <span class="text-xs text-muted">Archivos JPG individuales</span>
                        </div>
                    </span>
                    <i class="ph ph-download-simple text-xl text-accent group-hover:translate-y-1 transition-transform"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close Handler
    const close = () => {
        modal.remove();
    };
    modal.querySelector('#close-download').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    // PDF Handler
    modal.querySelector('#download-pdf').onclick = async () => {
        const btn = modal.querySelector('#download-pdf');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="flex items-center gap-2"><i class="ph ph-spinner ph-spin"></i> Generando...</span>';
        btn.disabled = true;

        try {
            const images = c.images.filter(img => selectedIds.includes(img.id));
            const pdfBlob = await generateLegalPdf(images);
            const url = URL.createObjectURL(pdfBlob);

            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${c.expediente.replace('/', '-')}_Documentos.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            close();
        } catch (e) {
            console.error(e);
            alert("Error generando PDF: " + e.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    };

    // Images Handler
    modal.querySelector('#download-imgs').onclick = async () => {
        const btn = modal.querySelector('#download-imgs');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="flex items-center gap-2"><i class="ph ph-spinner ph-spin"></i> Preparando...</span>';
        btn.disabled = true;

        try {
            const images = c.images.filter(img => selectedIds.includes(img.id));

            for (const img of images) {
                const fetchUrl = `${img.url}${img.url.includes('?') ? '&' : '?'}t=${Date.now()}`;
                const blob = await fetch(fetchUrl, { mode: 'cors', cache: 'no-store' }).then(r => r.blob());
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `${img.type || 'imagen'}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Small delay
                await new Promise(r => setTimeout(r, 500));
            }
            close();

        } catch (e) {
            console.error(e);
            alert("Error descargando imágenes: " + e.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    };
}
