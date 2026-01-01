import { db, storage } from './firebase_config.js';
import { AuthService } from './services/auth.js';
import { AIAnalysisService } from './services/ai_service.js';

// Helper to get dates relative to today
const today = new Date();
const getRelativeDate = (days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return d.toISOString().split('T')[0];
};

// Local Cache / Fallback Data
// Local Cache / Fallback Data
const LOCAL_STORAGE_KEY = 'legal_case_manager_data_v2'; // Version bump to clear old data

// Load initial data from LocalStorage or use default
let storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
export let appData = storedData ? JSON.parse(storedData) : {
    states: [
        {
            id: 'cdmx',
            name: 'Ciudad de México',
            subjects: [
                { id: 'cdmx-fam', name: 'Familiar', cases: [] },
                { id: 'cdmx-civ', name: 'Civil', cases: [] },
                { id: 'cdmx-pen', name: 'Penal', cases: [] },
                { id: 'cdmx-lab', name: 'Laboral', cases: [] }
            ]
        },
        {
            id: 'edomex',
            name: 'Estado de México',
            subjects: [
                { id: 'edomex-fam', name: 'Familiar', cases: [] },
                { id: 'edomex-civ', name: 'Civil', cases: [] }
            ]
        },
        {
            id: 'qro',
            name: 'Querétaro',
            subjects: [
                { id: 'qro-fam', name: 'Familiar', cases: [] },
                { id: 'qro-civ', name: 'Civil', cases: [] }
            ]
        }
    ],
    // State to hold pending promotions (filings)
    promotions: [],
    cases: {},
    // Mock user tasks for dashboard
    dashboardTasks: []
};

// Helper to save to LocalStorage
export function saveToLocal() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
        console.log("Datos guardados localmente");
    } catch (e) {
        console.error("Critical: LocalStorage Quota Exceeded or Error", e);
        // Only alert if critical
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            // alert("⚠️ Almacenamiento local lleno. Usando modo memoria."); // Optional: silent fail to not annoy
        }
    }
}

// --- PROMOTION LOGIC (FILING STAGING) ---
export const getPromotions = () => {
    return appData.promotions || [];
};

export const addPromotion = async (imageFile) => {
    let finalUrl = null;

    // 1. Try Firebase Upload
    if (storage) {
        try {
            console.log("Iniciando subida a Firebase Storage...");
            const fileName = `promo_${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = storage.ref().child('promotions/' + fileName);
            const snapshot = await storageRef.put(imageFile);
            finalUrl = await snapshot.ref.getDownloadURL();
            console.log("Promoción subida exitosamente:", finalUrl);
        } catch (e) {
            console.error("Error subiendo a Firebase, usando fallback local:", e);
        }
    }

    // 2. Fallback to Local Base64 if no URL yet (Offline or Error)
    if (!finalUrl) {
        console.warn("Usando almacenamiento local (Base64). Cuidado con el espacio.");
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(imageFile);
        });
        finalUrl = await base64Promise;
    }

    const newId = `promo-${Date.now()}`;
    const newPromo = {
        id: newId,
        url: finalUrl,
        name: imageFile.name,
        dateAdded: new Date().toISOString().split('T')[0],
        status: 'analyzing', // analyzing, ready
        aiAnalysis: null
    };

    appData.promotions = appData.promotions || [];
    appData.promotions.unshift(newPromo); // Add to top
    saveToLocal(); // Save initial state

    // Firebase Sync
    if (db) {
        db.collection('promotions_v2').doc(newId).set(newPromo).catch(err => {
            console.error("Error syncing promotion to cloud:", err);
        });
    }

    // Dispatch update event immediately
    window.dispatchEvent(new Event('promotions-updated'));

    // 2. Trigger AI Analysis (Async)
    AIAnalysisService.analyzePromotion(imageFile, (progress) => {
        // Optional: Update progress in store if needed
    }).then(analysis => {
        // Update promo with result
        const promoIndex = appData.promotions.findIndex(p => p.id === newId);
        if (promoIndex !== -1) {
            appData.promotions[promoIndex].aiAnalysis = analysis;
            appData.promotions[promoIndex].status = 'ready';

            // 3. Auto-Create Calendar Event if date found
            if (analysis && analysis.filingDate) {
                const filingDate = analysis.filingDate; // YYYY-MM-DD
                const eventTitle = `📜 Promoción: ${analysis.concept || 'Escrito presentado'}`;
                const eventDesc = `Juzgado: ${analysis.court || 'N/A'}\nExp: ${analysis.caseNumber || 'N/A'}`;

                // Add to calendar events
                // Simple event structure
                const newEvent = {
                    id: `evt-${Date.now()}`,
                    title: eventTitle,
                    description: eventDesc,
                    date: filingDate,
                    time: '09:00', // Default
                    type: 'audience', // Use 'audience' color/icon as placeholder
                    caseId: null // Not linked yet
                };

                // Store events if we have a place. 
                // Currently events are in cases or generated. 
                // For MVP, we'll annex it to a 'General' list or let CalendarView pull it?
                // Better: CalendarView should pull from promotions too OR we add to a 'general_events' store.
                // Let's add to a new 'stand-alone events' array in appData for simplicity
                appData.generalEvents = appData.generalEvents || [];
                appData.generalEvents.push(newEvent);
            }

            saveToLocal();
            window.dispatchEvent(new Event('promotions-updated'));
        }
    }).catch(err => {
        console.error("Promo Analysis Failed", err);
        const promoIndex = appData.promotions.findIndex(p => p.id === newId);
        if (promoIndex !== -1) {
            appData.promotions[promoIndex].status = 'error';
            saveToLocal();
            window.dispatchEvent(new Event('promotions-updated'));
        }
    });
    return newPromo;
};

// Retries analysis for an existing promotion (e.g. after error)
export const retryPromotionAnalysis = async (promoId) => {
    const promoIndex = appData.promotions.findIndex(p => p.id === promoId);
    if (promoIndex === -1) return;

    const promo = appData.promotions[promoIndex];

    // Set status directly to re-analyzing
    appData.promotions[promoIndex].status = 'analyzing';
    saveToLocal();
    window.dispatchEvent(new Event('promotions-updated'));

    try {
        // We need to fetch the blob because AI service expects a File/Blob
        // If it's a firebase URL, we fetch it. If it's base64, we convert it.
        const response = await fetch(promo.url);
        const blob = await response.blob();
        const file = new File([blob], promo.name, { type: blob.type });

        // Trigger AI Analysis
        AIAnalysisService.analyzePromotion(file, (progress) => {
            // Optional progress
        }).then(analysis => {
            const currentIdx = appData.promotions.findIndex(p => p.id === promoId);
            if (currentIdx !== -1) {
                appData.promotions[currentIdx].aiAnalysis = analysis;
                appData.promotions[currentIdx].status = 'ready'; // Success

                // Auto-Create Event logic (Duplicated from addPromotion - should be a helper but inline is fine for now)
                if (analysis && analysis.filingDate) {
                    const filingDate = analysis.filingDate;
                    const eventTitle = `📜 Promoción: ${analysis.concept || 'Escrito presentado'}`;
                    const eventDesc = `Juzgado: ${analysis.court || 'N/A'}\nExp: ${analysis.caseNumber || 'N/A'}`;
                    const newEvent = {
                        id: `evt-${Date.now()}`,
                        title: eventTitle,
                        description: eventDesc,
                        date: filingDate,
                        time: '09:00',
                        type: 'audience',
                        caseId: null
                    };
                    appData.generalEvents = appData.generalEvents || [];
                    appData.generalEvents.push(newEvent);
                }

                saveToLocal();
                window.dispatchEvent(new Event('promotions-updated'));
            }
        }).catch(err => {
            console.error("Retry Analysis Failed", err);
            const currentIdx = appData.promotions.findIndex(p => p.id === promoId);
            if (currentIdx !== -1) {
                appData.promotions[currentIdx].status = 'error';
                saveToLocal();
                window.dispatchEvent(new Event('promotions-updated'));
            }
        });

    } catch (e) {
        console.error("Error fetching image for retry:", e);
        appData.promotions[promoIndex].status = 'error';
        saveToLocal();
        window.dispatchEvent(new Event('promotions-updated'));
    }
};

export const deletePromotion = (promoId) => {
    appData.promotions = appData.promotions.filter(p => p.id !== promoId);
    saveToLocal();

    // Firebase Sync
    if (db) {
        db.collection('promotions_v2').doc(promoId).delete().catch(err => console.error("Error deleting from cloud:", err));
    }

    window.dispatchEvent(new Event('promotions-updated'));
};

export const movePromotionToCase = async (promoId, targetCaseId) => {
    const promo = appData.promotions.find(p => p.id === promoId);
    if (!promo) return;

    // 1. Get Target Case
    const c = getCase(targetCaseId);
    if (!c) return;

    // 2. Convert Promo to Image Object
    // Extract info from AI analysis to populate image metadata
    const newImage = {
        id: `img-${Date.now()}`,
        url: promo.url,
        name: `Promoción ${promo.aiAnalysis?.filingDate || ''} - ${promo.name}`,
        date: promo.aiAnalysis?.filingDate || new Date().toISOString().split('T')[0],
        type: 'promotion', // New type
        summary: promo.aiAnalysis?.concept || 'Promoción anexada desde pendientes',
        uploadedBy: 'user', // Auth placeholder
        aiAnalysis: promo.aiAnalysis // Keep the full analysis
    };

    if (c) {
        c.images.push(newImage);

        // Remove from promotions. Use filter or findIndex
        const promoIndex = appData.promotions.findIndex(p => p.id === promoId);
        if (promoIndex !== -1) {
            appData.promotions.splice(promoIndex, 1);

            // Firebase Delete (Sync)
            if (db) {
                db.collection('promotions_v2').doc(promoId).delete().catch(e => console.error("Error removing moved promo from cloud:", e));
            }
        }

        saveToLocal();

        // Firebase Update (if available)
        if (db) {
            try {
                // We add to the array
                // For safety in this MVP, we save the whole image array
                db.collection('cases_v2').doc(targetCaseId).update({
                    images: c.images
                });
            } catch (e) {
                console.error("Error syncing annex to firebase", e);
            }
        }
    }

    return newImage;
};

// --- Firebase Sync Logic ---
// In a real app, we would listen to onSnapshot here and update appData.
// For this demo, we'll implement simple "write-through" and "read-if-configured".

async function syncFromFirebase() {
    if (!db) return;
    try {
        // 1. Load Cases
        const casesSnapshot = await db.collection('cases_v2').get();
        if (!casesSnapshot.empty) {
            // Merge strategy: We trust Firebase more, but we don't want to lose local unsynced changes immediately.
            // For simplicity in this demo: We overwrite local cases with Firebase cases if they exist.
            // But we keep local cases that are NOT in Firebase (unsynced new cases).

            casesSnapshot.forEach(doc => {
                appData.cases[doc.id] = doc.data();
            });
        }

        // 2. Load Dashboard Tasks
        const tasksSnapshot = await db.collection('tasks_v2').get();
        if (!tasksSnapshot.empty) {
            appData.dashboardTasks = [];
            tasksSnapshot.forEach(doc => {
                appData.dashboardTasks.push(doc.data());
            });
        }

        // 3. Listen to Promotions (Real-time)
        if (db) {
            db.collection('promotions_v2').onSnapshot(snapshot => {
                const remotePromos = [];
                snapshot.forEach(doc => remotePromos.push(doc.data()));

                // Update local state
                remotePromos.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

                appData.promotions = remotePromos;
                saveToLocal();
                window.dispatchEvent(new Event('promotions-updated'));
                console.log("Promociones sincronizadas en tiempo real.");
            });
        }

        saveToLocal(); // Update local storage with synced data
        console.log("Datos sincronizados desde Firebase");
    } catch (e) {
        console.error("Error sincronizando con Firebase:", e);
    }
}

// Export initStore for app.js to wait on
export async function initStore() {
    console.log("initStore: Starting...");
    await syncFromFirebase();
    console.log("initStore: Completed");
}

// --- Getters ---

export function getState(id) {
    return appData.states.find(s => s.id === id);
}

export function getSubject(id) {
    for (const state of appData.states) {
        const subject = state.subjects.find(s => s.id === id);
        if (subject) return subject;
    }
    return null;
}

export function getCase(id) {
    return appData.cases[id];
}

export function getAllEvents() {
    const events = [];

    // 1. Dashboard Tasks
    appData.dashboardTasks.forEach(t => {
        events.push({
            title: t.title,
            date: t.date,
            type: 'task',
            urgent: t.type === 'urgent',
            caseId: t.caseId
        });
    });

    // 2. Case Events
    Object.values(appData.cases).forEach(c => {
        // Tasks
        if (c.tasks) {
            c.tasks.forEach(t => {
                events.push({
                    id: t.id,
                    title: `${t.title} (${c.juzgado})`,
                    date: t.date,
                    type: 'task',
                    urgent: t.urgent,
                    completed: t.completed,
                    completedBy: t.completedBy, // Add completedBy metadata
                    caseId: c.id
                });
            });
        }
        // Images (Attachments) - Grouped by Date
        if (c.images && c.images.length > 0) {
            const imagesByDate = {};

            c.images.forEach(img => {
                const date = img.date || c.lastUpdate;
                if (!imagesByDate[date]) {
                    imagesByDate[date] = [];
                }
                imagesByDate[date].push(img);

                // Deadlines are still individual events as they are critical
                if (img.deadline) {
                    events.push({
                        title: `Vence: ${img.type} (${c.expediente})`,
                        date: img.deadline,
                        type: 'deadline',
                        urgent: true,
                        caseId: c.id,
                        imgId: img.id
                    });
                }
            });

            // Create grouped events
            Object.keys(imagesByDate).forEach(date => {
                const imgs = imagesByDate[date];
                if (imgs.length === 1) {
                    // Single image: Show details
                    const img = imgs[0];
                    events.push({
                        title: `Expediente Revisado: ${img.type} - ${c.juzgado}`,
                        date: date,
                        type: 'attachment',
                        caseId: c.id,
                        imgId: img.id
                    });
                } else {
                    // Multiple images: Group them
                    events.push({
                        title: `📂 ${imgs.length} Nuevos Documentos (${c.expediente})`,
                        date: date,
                        type: 'attachment',
                        caseId: c.id,
                        // Link to the first image or just the case. 
                        // Linking to case is safer for "view all", but linking to first image opens viewer.
                        // Let's link to case view for now so they can see the list.
                        caseId: c.id
                    });
                }
            });
        }
    });

    return events;
}

// --- Mutation Methods (Updated for Firebase) ---

export async function addSubject(stateId, name) {
    const state = appData.states.find(s => s.id === stateId);
    if (state) {
        const newId = `${stateId}-${name.toLowerCase().slice(0, 3)}`;
        state.subjects.push({ id: newId, name: name, cases: [] });

        // Note: We are not syncing structure (states/subjects) to DB in this simple demo, 
        // only cases and tasks. In a full app, we'd sync this too.
        return newId;
    }
    return null;
}

export async function addCase(subjectId, caseData) {
    const newId = `exp-${Date.now()}`;
    const newCase = {
        id: newId,
        title: `${caseData.actor} vs ${caseData.demandado || 'N/A'}`, // Auto-generate title
        ...caseData,
        status: 'Nuevo',
        lastUpdate: new Date().toISOString().split('T')[0],
        images: [],
        tasks: []
    };

    // Local Update
    appData.cases[newId] = newCase;
    for (const state of appData.states) {
        const subject = state.subjects.find(s => s.id === subjectId);
        if (subject) {
            subject.cases.push(newId);
            break;
        }
    }
    saveToLocal();

    // Firebase Update
    if (db) {
        try {
            await db.collection('cases_v2').doc(newId).set(newCase);
            console.log("Caso guardado en Firebase");
        } catch (e) {
            console.error("Error guardando en Firebase:", e);
        }
    }

    return newId;
}

export async function addTask(caseId, taskData) {
    const c = appData.cases[caseId];
    if (!c) return false;

    const newTask = {
        id: `task-${Date.now()}`,
        title: taskData.title,
        date: taskData.date,
        urgent: taskData.urgent,
        completed: false,
        createdBy: AuthService.getUserSignature() // Added createdBy
    };

    if (!c.tasks) c.tasks = [];
    c.tasks.push(newTask);
    saveToLocal();

    // Firebase Update
    if (db) {
        try {
            await db.collection('cases_v2').doc(caseId).update({
                tasks: firebase.firestore.FieldValue.arrayUnion(newTask)
            });
        } catch (e) {
            console.error("Error agregando tarea a Firebase:", e);
            // Fallback
            await db.collection('cases_v2').doc(caseId).update({
                tasks: c.tasks
            });
        }
    }
    return true;
}

export async function updateTask(caseId, taskId, updates) {
    const c = appData.cases[caseId];
    if (!c || !c.tasks) return false;

    const task = c.tasks.find(t => t.id === taskId);
    if (!task) return false;

    Object.assign(task, updates);

    if (updates.completed !== undefined) {
        task.completed = updates.completed;
        if (task.completed) {
            task.completedBy = AuthService.getUserSignature();
        } else {
            delete task.completedBy;
        }
    }

    saveToLocal();

    if (db) {
        try {
            // Update the entire tasks array for simplicity, or use a transaction
            await db.collection('cases_v2').doc(caseId).update({
                tasks: c.tasks
            });
        } catch (e) {
            console.error("Error actualizando tarea en Firebase:", e);
        }
    }
    return true;
}

export async function updateCase(caseId, updatedData) {
    const c = appData.cases[caseId];
    if (!c) return false;

    // Merge data
    Object.assign(c, updatedData);

    // Update title if actor/demandado changed
    if (updatedData.actor || updatedData.demandado) {
        c.title = `${c.actor || updatedData.actor} vs ${c.demandado || updatedData.demandado || 'N/A'}`;
    }
    saveToLocal();

    // Firebase Update
    if (db) {
        try {
            await db.collection('cases_v2').doc(caseId).update(updatedData);
        } catch (e) {
            console.error("Error actualizando en Firebase:", e);
        }
    }
    return true;
}

export async function deleteCase(caseId) {
    // Remove from cases map
    delete appData.cases[caseId];

    // Remove reference from subjects
    for (const state of appData.states) {
        for (const subject of state.subjects) {
            const idx = subject.cases.indexOf(caseId);
            if (idx !== -1) {
                subject.cases.splice(idx, 1);
                break;
            }
        }
    }
    saveToLocal();

    // Firebase Delete
    if (db) {
        try {
            await db.collection('cases_v2').doc(caseId).delete();
        } catch (e) {
            console.error("Error borrando en Firebase:", e);
        }
    }
    return true;
}

// Helper to get all cases as array (for UI selectors)
export function getCases() {
    return Object.values(appData.cases || {});
}

// Helper to Update Promotion Metadata
export async function updatePromotion(promoId, updates) {
    const promo = appData.promotions.find(p => p.id === promoId);
    if (!promo) return false;

    Object.assign(promo, updates);
    saveToLocal();

    // Firebase Sync
    if (db) {
        db.collection('promotions_v2').doc(promoId).update(updates).catch(e => console.error("Error updating promo cloud:", e));
    }

    return true;
}

// --- Debug / Reset Tools ---
export async function wipeCloudData() {
    if (!confirm("⚠️ ¡ADVERTENCIA! ⚠️\n\nEsto borrará PERMANENTEMENTE todos los datos de la base de datos (Casos, Tareas, Promociones) en la nube.\n\n¿Estás seguro que deseas continuar?")) {
        return;
    }

    if (db) {
        try {
            console.log("Iniciando borrado masivo...");

            // 1. Delete Cases
            const casesQ = await db.collection('cases_v2').get();
            const caseBatch = db.batch();
            casesQ.forEach(doc => caseBatch.delete(doc.ref));
            await caseBatch.commit();
            console.log(`Eliminados ${casesQ.size} casos.`);

            // 2. Delete Tasks
            const tasksQ = await db.collection('tasks_v2').get();
            const tasksBatch = db.batch();
            tasksQ.forEach(doc => tasksBatch.delete(doc.ref));
            await tasksBatch.commit();
            console.log(`Eliminadas ${tasksQ.size} tareas.`);

            // 3. Delete Promotions
            const promosQ = await db.collection('promotions_v2').get();
            const promosBatch = db.batch();
            promosQ.forEach(doc => promosBatch.delete(doc.ref));
            await promosBatch.commit();
            console.log(`Eliminadas ${promosQ.size} promociones.`);

        } catch (e) {
            console.error("Error borrando datos:", e);
            alert("Error borrando datos de la nube: " + e.message);
        }
    }

    // Clear Local
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
}

export async function addImageToCase(caseId, fileObj, onProgress) {
    // alert("Store: Buscando caso " + caseId); // Removed Debug
    const c = appData.cases[caseId];
    if (c) {
        const name = fileObj.name || 'Documento';
        const type = name.length > 20 ? name.substring(0, 20) + '...' : name;

        // Default to local URL
        let fileUrl = URL.createObjectURL(fileObj);

        // Firebase Storage Upload
        if (storage) {
            try {
                // Ensure Auth is ready
                if (!firebase.auth().currentUser) {
                    console.log("Esperando autenticación...");
                    await firebase.auth().signInAnonymously();
                }

                const storageRef = storage.ref();
                const fileRef = storageRef.child(`cases/${caseId}/${fileObj.name}-${Date.now()}`);

                const uploadTask = fileRef.put(fileObj);

                // Wait for upload with 120s timeout
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        uploadTask.cancel();
                        reject(new Error("La conexión expiró (timeout 120s). Posible bloqueo de seguridad (CORS)."));
                    }, 120000);

                    // Detect stall
                    const stallCheckId = setTimeout(() => {
                        if (uploadTask.snapshot.bytesTransferred === 0) {
                            console.warn("La subida no ha comenzado después de 5s. Posible error de CORS.");
                            if (onProgress) onProgress(1); // Fake 1% to show life
                        }
                    }, 5000);

                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Progress
                            if (onProgress) {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                onProgress(progress);
                            }
                        },
                        (error) => {
                            clearTimeout(timeoutId);
                            clearTimeout(stallCheckId);
                            console.error("Firebase Storage Error:", error.code, error.message);
                            reject(error);
                        },
                        () => {
                            clearTimeout(timeoutId);
                            clearTimeout(stallCheckId);
                            resolve();
                        }
                    );
                });

                fileUrl = await fileRef.getDownloadURL();
                console.log("Archivo subido a Firebase Storage:", fileUrl);
            } catch (e) {
                console.error("Error subiendo archivo a Firebase:", e);
                // Fallback to local URL if upload fails
                alert("Aviso: " + e.message + "\n\nLa imagen se guardó en tu teléfono, pero no se pudo sincronizar con la nube.");
            }
        } else {
            console.warn("Storage no disponible, usando URL local");
        }

        const newImg = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: fileUrl,
            type: type,
            summary: name,
            deadline: null,
            nextAction: 'Esperando revisión',
            date: new Date().toISOString().split('T')[0]
        };

        c.images.push(newImg);
        c.lastUpdate = new Date().toISOString().split('T')[0];
        saveToLocal();

        // Update Case in Firebase
        if (db) {
            try {
                await db.collection('cases_v2').doc(caseId).update({
                    images: firebase.firestore.FieldValue.arrayUnion(newImg),
                    lastUpdate: c.lastUpdate
                });
                // alert("Store: Base de datos actualizada."); // Removed Debug
            } catch (e) {
                console.error("Error actualizando caso en Firebase:", e);

                // If document doesn't exist (e.g. mock case), create it
                if (e.code === 'not-found' || e.message.includes('No document to update')) {
                    try {
                        console.log("Caso no existe en nube, creando copia completa...");
                        await db.collection('cases').doc(caseId).set(c);
                        // alert("Aviso: Se creó el expediente en la nube para sincronización.");
                    } catch (createErr) {
                        console.error("Error creando caso en Firebase:", createErr);
                        alert("Error guardando datos en nube: " + createErr.message);
                    }
                } else {
                    alert("Error guardando datos: " + e.message);
                }
            }
        }

        // Trigger Mock AI Analysis
        mockAnalyzeImage(caseId, newImg.id);

        return newImg;
    } else {
        alert("Error crítico: No se encontró el caso en memoria local.");
    }
    return null;
}

// Mock AI Analysis Service
async function mockAnalyzeImage(caseId, imgId) {
    console.log(`Iniciando análisis AI para imagen ${imgId}...`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    const c = appData.cases[caseId];
    if (!c) return;

    const img = c.images.find(i => i.id === imgId);
    if (!img) return;

    // Generate mock insights based on file type/name (randomized for demo)
    const isDeadline = Math.random() > 0.3; // 70% chance of finding a deadline
    const days = Math.floor(Math.random() * 10) + 3;

    const updates = {
        summary: `Documento analizado por IA. Se identifica como ${img.type}. Contenido relevante extraído.`,
        nextAction: isDeadline ? 'Atender vencimiento de término' : 'Revisar contenido y archivar',
        deadline: isDeadline ? getRelativeDate(days) : null
    };

    // Apply updates locally
    Object.assign(img, updates);
    saveToLocal();

    // Update Firebase
    if (db) {
        try {
            // Note: Updating a single item in an array in Firestore is hard.
            // We typically replace the whole array or use a subcollection.
            // For this demo, we'll replace the whole images array.
            await db.collection('cases').doc(caseId).update({
                images: c.images
            });
            console.log("AI Analysis updated in Firebase");

            // Notify UI to refresh if possible (using a custom event)
            window.dispatchEvent(new CustomEvent('case-updated', { detail: { caseId } }));

        } catch (e) {
            console.error("Error updating AI analysis:", e);
        }
    }
}

export async function deleteImageFromCase(caseId, imgId) {
    const c = appData.cases[caseId];
    if (!c) return false;

    const imgIndex = c.images.findIndex(i => i.id === imgId);
    if (imgIndex === -1) return false;

    const img = c.images[imgIndex];

    // Remove locally
    c.images.splice(imgIndex, 1);
    saveToLocal();

    // Update Firebase
    if (db) {
        try {
            await db.collection('cases').doc(caseId).update({
                images: firebase.firestore.FieldValue.arrayRemove(img)
            });
        } catch (e) {
            console.error("Error eliminando imagen de Firebase:", e);
            // Fallback: update entire array
            await db.collection('cases').doc(caseId).update({
                images: c.images
            });
        }
    }

    return true;
}

export async function deleteImages(caseId, imageIds) {
    const c = appData.cases[caseId];
    if (!c || !c.images) return false;

    // Filter out deleted images
    const originalLength = c.images.length;
    c.images = c.images.filter(img => !imageIds.includes(img.id));

    if (c.images.length === originalLength) return false; // Nothing deleted

    saveToLocal();

    // Update Firebase
    if (db) {
        try {
            await db.collection('cases').doc(caseId).update({
                images: c.images
            });
        } catch (e) {
            console.error("Error eliminando imágenes de Firebase:", e);
        }
    }
    return true;
}

export async function reorderImages(caseId, newOrderIds) {
    const c = appData.cases[caseId];
    if (!c || !c.images) return false;

    // Create a map for quick lookup
    const imgMap = new Map(c.images.map(img => [img.id, img]));

    // Reconstruct array based on new order
    const newImages = [];
    newOrderIds.forEach(id => {
        if (imgMap.has(id)) {
            newImages.push(imgMap.get(id));
            imgMap.delete(id);
        }
    });

    // Append any remaining images (safety fallback)
    imgMap.forEach(img => newImages.push(img));

    c.images = newImages;
    saveToLocal();

    // Update Firebase
    if (db) {
        try {
            await db.collection('cases').doc(caseId).update({
                images: c.images
            });
        } catch (e) {
            console.error("Error reordenando imágenes en Firebase:", e);
        }
    }
    return true;
}



