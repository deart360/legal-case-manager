import { getCase, addImageToCase } from '../store.js';

export function createCaseView(caseId) {
    const container = document.createElement('div');
    container.className = 'case-view p-6';

    const c = getCase(caseId);
    if (!c) {
        container.innerHTML = `<h2>Expediente no encontrado</h2>`;
        return container;
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
                    <input type="file" id="file-upload" class="hidden" accept="image/*,application/pdf" multiple>
                    <button class="btn-primary" onclick="document.getElementById('file-upload').click()">
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
            <div class="doc-card upload-card" onclick="document.getElementById('file-upload').click()">
                <i class="ph ph-plus"></i>
                <span>Anexar Foto</span>
            </div>
        </div>
    `;

    container.innerHTML = header + imagesHtml;

    // Inject handlers
    // Handle File Upload
    const fileInput = container.querySelector('#file-upload');
    fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // alert("Iniciando subida de " + files.length + " archivos..."); // Debug

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
                    // alert("Procesando imagen: " + file.name); // Debug
                    const result = await addImageToCase(caseId, file);
                    if (result) {
                        newCount++;
                    } else {
                        alert("Error: No se pudo agregar la imagen " + file.name);
                    }
                }
            } catch (err) {
                console.error("Error en archivo " + file.name, err);
                alert("Error subiendo " + file.name + ": " + err.message);
            }
        }

        if (newCount > 0) {
            // alert("Subida completada. Refrescando..."); // Debug
            // Refresh view by reloading hash
            const currentHash = window.location.hash;
            window.location.hash = '';
            setTimeout(() => {
                window.location.hash = currentHash;
            }, 50); // Increased timeout slightly
        } else {
            alert("No se agregaron archivos. Revisa la consola.");
        }
    };



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
        blob.name = `${file.name} - Pág ${i}`;

        // We need to pass the name explicitly or modify store to read it
        // For now, let's rely on store modification in next step or current behavior
        addImageToCase(caseId, blob);
    }
}
