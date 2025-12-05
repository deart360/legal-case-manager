import { db, storage } from './firebase_config.js';

// Helper to get dates relative to today
const today = new Date();
const getRelativeDate = (days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return d.toISOString().split('T')[0];
};

// Local Cache / Fallback Data
export let appData = {
    states: [
        {
            id: 'cdmx',
            name: 'Ciudad de México',
            subjects: [
                { id: 'cdmx-fam', name: 'Familiar', cases: ['exp-001', 'exp-002'] },
                { id: 'cdmx-civ', name: 'Civil', cases: ['exp-003'] },
                { id: 'cdmx-pen', name: 'Penal', cases: ['exp-005'] },
                { id: 'cdmx-lab', name: 'Laboral', cases: ['exp-006'] }
            ]
        },
        {
            id: 'edomex',
            name: 'Estado de México',
            subjects: [
                { id: 'edomex-fam', name: 'Familiar', cases: [] },
                { id: 'edomex-civ', name: 'Civil', cases: ['exp-004'] }
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
    cases: {
        'exp-001': {
            id: 'exp-001',
            title: 'Divorcio Incausado - Perez vs Martinez',
            expediente: '1234/2024',
            juzgado: 'Juzgado 12 Familiar CDMX',
            status: 'En Proceso',
            lastUpdate: getRelativeDate(0),
            images: [
                { id: 'img1', url: 'https://placehold.co/600x800/png?text=Auto+Admisorio', type: 'Auto', summary: 'Se admite la demanda de divorcio.', deadline: getRelativeDate(2), nextAction: 'Presentar propuesta de convenio.', date: getRelativeDate(-2) },
                { id: 'img2', url: 'https://placehold.co/600x800/png?text=Notificaci%C3%B3n', type: 'Notificación', summary: 'Emplazamiento a la contraparte realizado.', deadline: null, nextAction: 'Esperar contestación (9 días)', date: getRelativeDate(0) }
            ],
            tasks: [
                { id: 't1', title: 'Audiencia Conciliatoria', date: getRelativeDate(5), urgent: true }
            ]
        },
        'exp-002': {
            id: 'exp-002',
            title: 'Sucesión Intestamentaria - Familia López',
            expediente: '987/2023',
            juzgado: 'Juzgado 4 Familiar CDMX',
            status: 'Radicación',
            lastUpdate: getRelativeDate(-1),
            images: [
                { id: 'img3', url: 'https://placehold.co/600x800/png?text=Declaratoria+Herederos', type: 'Sentencia', summary: 'Se reconocen herederos a hijos y cónyuge.', deadline: null, nextAction: 'Designar albacea', date: getRelativeDate(-1) }
            ],
            tasks: []
        },
        'exp-003': {
            id: 'exp-003',
            title: 'Juicio Ordinario Civil - Arrendamiento',
            expediente: '888/2023',
            juzgado: 'Juzgado 5 Civil CDMX',
            status: 'Sentencia',
            images: [],
            tasks: [
                { id: 't2', title: 'Recoger billete de depósito', date: getRelativeDate(1), urgent: false }
            ]
        },
        'exp-004': {
            id: 'exp-004',
            title: 'Ejecutivo Mercantil - Banco vs Empresa X',
            expediente: '111/2024',
            juzgado: 'Juzgado 2 Civil EdoMex',
            status: 'Embargo',
            lastUpdate: getRelativeDate(1),
            images: [
                { id: 'img4', url: 'https://placehold.co/600x800/png?text=Diligencia+Embargo', type: 'Acta', summary: 'Se traba embargo sobre bienes muebles.', deadline: getRelativeDate(4), nextAction: 'Inscribir embargo RPP', date: getRelativeDate(1) }
            ],
            tasks: []
        },
        'exp-005': {
            id: 'exp-005',
            title: 'Carpeta Investigación - Robo',
            expediente: 'CI-FCH/CU/UI-1/002/2024',
            juzgado: 'Fiscalía Cuauhtémoc',
            status: 'Investigación',
            lastUpdate: getRelativeDate(2),
            images: [],
            tasks: [
                { id: 't3', title: 'Acompañar a ratificación', date: getRelativeDate(2), urgent: true },
                { id: 't4', title: 'Presentar peritaje', date: getRelativeDate(3), urgent: true }
            ]
        },
        'exp-006': {
            id: 'exp-006',
            title: 'Despido Injustificado - Ramirez vs Patrón',
            expediente: '567/2024',
            juzgado: 'Junta Local Conciliación',
            status: 'Conciliación',
            lastUpdate: getRelativeDate(3),
            images: [
                { id: 'img5', url: 'https://placehold.co/600x800/png?text=Citatorio', type: 'Citatorio', summary: 'Cita para pláticas conciliatorias.', deadline: getRelativeDate(3), nextAction: 'Asistir a audiencia', date: getRelativeDate(3) }
            ],
            tasks: []
        }
    },
    // Mock user tasks for dashboard
    dashboardTasks: [
        { id: 'dt1', title: 'Revisar acuerdo Exp 1234/2024', date: getRelativeDate(0), type: 'urgent', caseId: 'exp-001' },
        { id: 'dt2', title: 'Presentar promoción Exp 888/2023', date: getRelativeDate(1), type: 'normal', caseId: 'exp-003' },
        { id: 'dt3', title: 'Llamar a cliente (Divorcio)', date: getRelativeDate(0), type: 'normal', caseId: 'exp-001' },
        { id: 'dt4', title: 'Pagar copias certificadas', date: getRelativeDate(2), type: 'normal', caseId: 'exp-005' }
    ]
};

// --- Firebase Sync Logic ---
// In a real app, we would listen to onSnapshot here and update appData.
// For this demo, we'll implement simple "write-through" and "read-if-configured".

async function syncFromFirebase() {
    if (!db) return;
    try {
        // 1. Load Cases
        const casesSnapshot = await db.collection('cases').get();
        if (!casesSnapshot.empty) {
            appData.cases = {}; // Clear mock cases if we have real data
            casesSnapshot.forEach(doc => {
                appData.cases[doc.id] = doc.data();
            });
        }

        // 2. Load Dashboard Tasks
        const tasksSnapshot = await db.collection('tasks').get();
        if (!tasksSnapshot.empty) {
            appData.dashboardTasks = [];
            tasksSnapshot.forEach(doc => {
                appData.dashboardTasks.push(doc.data());
            });
        }
        console.log("Datos sincronizados desde Firebase");
    } catch (e) {
        console.error("Error sincronizando con Firebase:", e);
    }
}

// Initial sync attempt
syncFromFirebase();

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
                    title: `${t.title} (${c.juzgado})`,
                    date: t.date,
                    type: 'task',
                    urgent: t.urgent,
                    caseId: c.id
                });
            });
        }
        // Images (Attachments)
        if (c.images) {
            c.images.forEach(img => {
                events.push({
                    title: `Expediente Revisado: ${img.type} - ${c.juzgado}`,
                    date: img.date || c.lastUpdate,
                    type: 'attachment',
                    caseId: c.id,
                    imgId: img.id
                });
                // Deadlines from images
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

    // Firebase Update
    if (db) {
        try {
            await db.collection('cases').doc(newId).set(newCase);
            console.log("Caso guardado en Firebase");
        } catch (e) {
            console.error("Error guardando en Firebase:", e);
        }
    }

    return newId;
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

    // Firebase Update
    if (db) {
        try {
            await db.collection('cases').doc(caseId).update(updatedData);
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

    // Firebase Delete
    if (db) {
        try {
            await db.collection('cases').doc(caseId).delete();
        } catch (e) {
            console.error("Error borrando en Firebase:", e);
        }
    }
    return true;
}

export async function addImageToCase(caseId, fileObj) {
    // alert("Store: Buscando caso " + caseId); // Debug
    const c = appData.cases[caseId];
    if (c) {
        const name = fileObj.name || 'Documento';
        const type = name.length > 20 ? name.substring(0, 20) + '...' : name;

        // Default to local URL
        let fileUrl = URL.createObjectURL(fileObj);

        // Firebase Storage Upload
        if (storage) {
            try {
                // alert("Store: Iniciando subida a Firebase..."); // Debug
                const storageRef = storage.ref();
                const fileRef = storageRef.child(`cases/${caseId}/${fileObj.name}-${Date.now()}`);

                // Add a timeout to the upload to prevent hanging
                const uploadTask = fileRef.put(fileObj);

                // Wait for upload
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            // Progress
                        },
                        (error) => {
                            reject(error);
                        },
                        () => {
                            resolve();
                        }
                    );
                });

                fileUrl = await fileRef.getDownloadURL();
                // alert("Store: Subida completada. URL: " + fileUrl); // Debug
                console.log("Archivo subido a Firebase Storage:", fileUrl);
            } catch (e) {
                console.error("Error subiendo archivo a Firebase:", e);
                alert("Error subiendo a nube: " + e.message + "\nUsando modo local.");
            }
        } else {
            console.warn("Storage no disponible, usando URL local");
            alert("Aviso: Nube no conectada. Se guardará solo en este dispositivo.");
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

        // Update Case in Firebase
        if (db) {
            try {
                await db.collection('cases').doc(caseId).update({
                    images: firebase.firestore.FieldValue.arrayUnion(newImg),
                    lastUpdate: c.lastUpdate
                });
                // alert("Store: Base de datos actualizada."); // Debug
            } catch (e) {
                console.error("Error actualizando caso en Firebase:", e);
                alert("Error guardando datos: " + e.message);
            }
        }

        return newImg;
    } else {
        alert("Error crítico: No se encontró el caso en memoria local.");
    }
    return null;
}
