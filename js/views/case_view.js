import { getCase, addImageToCase } from '../store.js';

export function createCaseView(caseId) {
    const container = document.createElement('div');
    container.className = 'case-view p-6';

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
                        <button class="btn-icon-sm bg-glass" onclick="window.openCaseModal('', '${caseId}')" title="Editar">
                            <i class="ph ph-pencil"></i>
                        </button>
                        <button class="btn-icon-sm bg-glass text-danger" onclick="window.confirmDeleteCase('${caseId}')" title="Eliminar">
                            <i class="ph ph-trash"></i>
                        </button>
                        <div class="w-px h-6 bg-white/10 mx-2"></div>
                        <input type="file" id="file-upload-${caseId}" class="hidden" accept="image/*,application/pdf" multiple>
                        <button class="btn-primary btn-upload-trigger">
                            <i class="ph ph-camera"></i> Anexar Fotos/PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Image Grid
        const imagesHtml = `
            <div class="documents-grid">
                ${c.images.map(img => `
                    <div class="doc-card" onclick="event.stopPropagation(); window.openImage('${caseId}', '${img.id}')">
                        <div class="doc-preview">
                            <img src="${img.url}" alt="${img.type}">
                            <div class="doc-overlay">
                                <i class="ph ph-magnifying-glass-plus"></i>
                            </div>
                            <button class="btn-icon-xs bg-glass text-danger absolute top-2 right-2" 
                                    onclick="event.stopPropagation(); window.confirmDeleteImage('${caseId}', '${img.id}')"
                                    title="Eliminar documento">
                                <i class="ph ph-trash"></i>
                            </button>
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
                
                <!-- Upload Placeholder -->
                <div class="doc-card upload-card">
                    <i class="ph ph-plus"></i>
                    <span>Anexar Foto</span>
                </div>
            </div>
        `;

        container.innerHTML = header + imagesHtml;

        // Re-attach handlers
        const fileInput = container.querySelector(`#file-upload-${caseId}`);
        const uploadBtn = container.querySelector('.btn-upload-trigger');
        const uploadCard = container.querySelector('.upload-card');

        // Bind click events programmatically to avoid ID collisions
        const triggerUpload = () => {
            // alert("Abriendo selector de archivos..."); // Debug trigger
            fileInput.click();
        };

        if (uploadBtn) uploadBtn.onclick = triggerUpload;
        if (uploadCard) uploadCard.onclick = triggerUpload;

        fileInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // UI Feedback
            const originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Procesando...';
            uploadBtn.disabled = true;

            // alert("Detectados " + files.length + " archivos. Iniciando proceso..."); // Removed Debug

            let newCount = 0;
            const pdfLib = window.pdfjsLib;

            for (const file of files) {
                try {
                    if (file.type === 'application/pdf') {
                        // Handle PDF
                        if (!pdfLib) throw new Error("Librería PDF no cargada");
                        await processPdfFile(caseId, file, pdfLib);
                        newCount++;
                    } else {
                        // Handle Image
                        const result = await addImageToCase(caseId, file);
                        if (result) {
                            newCount++;
                        } else {
                            console.error("Error agregando imagen:", file.name);
                        }
                    }
                } catch (err) {
                    console.error("Error en archivo " + file.name, err);
                    alert("Error procesando " + file.name + ": " + err.message);
                }
            }

            // Restore UI
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;

            if (newCount > 0) {
                // Re-render in place
                render();
            } else {
                // Only alert if absolutely nothing happened
                // alert("No se agregaron archivos. Revisa la consola.");
            }
        };
    };

    // Listen for AI updates
    const aiUpdateHandler = (e) => {
        if (e.detail.caseId === caseId) {
            // alert("AI Finalizó análisis. Actualizando..."); // Optional feedback
            render();
        }
    };
    window.addEventListener('case-updated', aiUpdateHandler);

    // Initial render
    render();

    // Cleanup listener when view is removed (simple approximation)
    // In a full framework we'd use a proper lifecycle hook.
    // For now, we rely on the fact that the container will be removed.

    return container;
}

async function processPdfFile(caseId, file, pdfLib) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfLib.getDocument(arrayBuffer).promise;

    // Iterate through all pages
    for (let i = 1; i <= pdf.numPages; i++) {
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
        blob.name = `${file.name} - Pág ${i} `;

        // We need to pass the name explicitly or modify store to read it
        // For now, let's rely on store modification in next step or current behavior
        addImageToCase(caseId, blob);
    }
}
