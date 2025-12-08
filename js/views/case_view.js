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
                            <img src="${img.url}" alt="${img.type}">
                            
                            ${isSelectionMode ? `
                            <div class="selection-overlay absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                                 onclick="event.stopPropagation(); window.toggleSelection('${img.id}')">
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
                <button class="btn-secondary w-full justify-between" id="share-imgs" disabled title="Próximamente">
                    <span class="flex items-center gap-2"><i class="ph ph-images"></i> Imágenes Sueltas</span>
                    <span class="text-xs badge">Próximamente</span>
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
