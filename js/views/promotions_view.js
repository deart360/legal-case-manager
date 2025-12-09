import { getPromotions, addPromotion } from '../store.js';
import { showImageViewer } from './image_viewer.js';

export function createPromotionsView() {
    const container = document.createElement('div');
    container.className = 'promotions-view p-6 pb-24'; // Padding for bottom nav

    const promotions = getPromotions();

    const header = `
        <div class="view-header flex justify-between items-center mb-6">
            <div>
                <button onclick="history.back()" class="btn-text text-muted mb-2"><i class="ph ph-arrow-left"></i> Volver</button>
                <h1 class="h2">Promociones Pendientes</h1>
                <p class="text-muted text-sm">Escritos y notificaciones por clasificar.</p>
            </div>
            <button class="btn-primary" onclick="document.getElementById('promo-input-view').click()">
                <i class="ph ph-camera"></i> Nueva
            </button>
            <input type="file" id="promo-input-view" accept="image/*" class="hidden">
        </div>
    `;

    const grid = `
        <div class="documents-grid" id="promo-grid">
            ${promotions.map(p => `
                <div class="doc-card relative" onclick="window.openPromotion('${p.id}')">
                    <div class="doc-preview group">
                        <img src="${p.url}" alt="Promoción" crossorigin="anonymous">
                        <div class="doc-overlay flex flex-col items-center justify-center gap-4 transition-opacity opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px]">
                            <button class="btn-icon-glass text-white scale-125" title="Ver Detalles">
                                <i class="ph ph-magnifying-glass-plus"></i>
                            </button>
                             <button class="btn-icon-glass text-red-400 hover:text-red-300 hover:bg-red-900/40" onclick="event.stopPropagation(); window.deletePromoWrapper('${p.id}')" title="Eliminar">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                        
                        <!-- Status Badge -->
                        ${p.status === 'analyzing' ? `
                        <div class="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                            <i class="ph ph-spinner animate-spin"></i> Analizando...
                        </div>
                        ` : ''}
                        
                         ${p.status === 'error' ? `
                        <div class="absolute top-2 right-2 bg-red-900/80 backdrop-blur px-2 py-1 rounded text-xs text-red-200 flex items-center gap-1 cursor-pointer" onclick="event.stopPropagation(); window.retryPromotion('${p.id}')">
                            <i class="ph ph-arrow-clockwise"></i> Error (Reintentar)
                        </div>
                        ` : ''}

                        ${p.aiAnalysis?.filingDate ? `
                        <div class="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-2 text-xs text-center border-t border-white/10">
                            📅 ${p.aiAnalysis.filingDate}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}

            ${promotions.length === 0 ? `
                <div class="col-span-full text-center py-12 text-muted">
                    <i class="ph ph-files text-4xl mb-4 opacity-30"></i>
                    <p>No hay promociones pendientes.</p>
                </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = header + grid;

    // Events
    const input = container.querySelector('#promo-input-view');
    if (input) {
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const { addPromotion } = await import('../store.js');
            // Optimistic reload or append? For MVP, reload view by navigating
            addPromotion(file); // This will trigger 'promotions-updated'
            // We rely on the event listener in dashboard or a global reload... 
            // Ideally, we should refresh this view.
            container.innerHTML = '<div class="flex items-center justify-center h-64"><i class="ph ph-spinner animate-spin text-2xl"></i></div>';
            setTimeout(() => {
                // Re-render essentially
                import('../router.js').then(r => r.initRouter());
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            }, 500);
        };
    }

    return container;
}

// Global helper for onclick
window.openPromotion = (id) => {
    // Mode 'promotion' tells the viewer to show the special buttons
    showImageViewer(null, id, 'promotion');
};
