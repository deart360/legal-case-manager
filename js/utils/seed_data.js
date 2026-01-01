import { addCase, addTask, appData, saveToLocal } from '../store.js';

export async function seedScheduleData() {
    if (!confirm("¿Importar datos del reporte semanal (Enero 2026)?\nEsto agregará casos y tareas a la base de datos vacía.")) {
        return;
    }

    console.log("Iniciando importación de datos...");

    // 1. Define Cases found in doc
    // Structure: { tags: [id_subject, ...], data: { ... } }
    const casesToCreate = [
        // Control de Escritos
        {
            subjectId: 'cdmx-fam',
            data: { expediente: '1474/2002', juzgado: '26 Familiar CDMX', actor: 'Desconocido', demandado: 'Desconocido', summary: 'Estar al pendiente. No ha salido este acuerdo.' }
        },
        {
            subjectId: 'edomex-civ', // IFREM usually Administrative/Civil
            data: { expediente: 'Sin Número', juzgado: 'IFREM', actor: 'Leopoldo', demandado: 'Trámite', summary: 'Ir en 20 días. (Entrada 10 Dic 25)' }
        },
        {
            subjectId: 'cdmx-civ',
            data: { expediente: '1252/22', juzgado: '12 Civil CDMX', actor: 'Pérez Castil', demandado: 'Desconocido', summary: 'Checar Boletín (Pub 20-Nov-25).' }
        },
        {
            subjectId: 'cdmx-fam',
            data: { expediente: '889/24', juzgado: '21 Familiar CDMX', actor: 'Olivera Glez', demandado: 'Desconocido', summary: 'Ver si ya pidieron electrónicamente este exp.' }
        },
        {
            subjectId: 'cdmx-civ', // 'Otro Adm'
            data: { expediente: '2017/25', juzgado: '1 Otro Adm', actor: 'Chino', demandado: 'Desconocido', summary: 'Están de vacaciones, regresan en enero.' }
        },
        {
            subjectId: 'qro-fam',
            data: { expediente: '476/20', juzgado: '6 Familiar Qro', actor: 'Suc. Roldán', demandado: 'Sucesión', summary: 'Checar (15 Dic).' }
        },
        {
            subjectId: 'edomex-fam',
            data: { expediente: '423/22', juzgado: '4 Fam Naucalpan', actor: 'Desconocido', demandado: 'Desconocido', summary: 'Checar (15 Dic).' }
        },
        {
            subjectId: 'edomex-fam',
            data: { expediente: '1054/25', juzgado: '1 Fam Tlalnepantla', actor: 'Laura', demandado: 'Desconocido', summary: 'Checar (15 Dic).' }
        },
        {
            subjectId: 'edomex-civ',
            data: { expediente: '187/23', juzgado: '1 Civil Tlalnepantla', actor: 'Mario', demandado: 'Desconocido', summary: 'Checar (15 Dic).' }
        },
        // Vencimientos (New Cases if not above)
        {
            subjectId: 'edomex-fam',
            data: { expediente: '427/2022', juzgado: '4 Fam Naucalpan', actor: 'Desconocido', demandado: 'Desconocido', summary: 'Indicar al Juez que ya esta toda la información.' }
        },
        {
            subjectId: 'edomex-fam',
            data: { expediente: '186/2025', juzgado: '5 Fam Toluca', actor: 'Albaceas', demandado: 'Desconocido', summary: 'vs auto que no quita fianza a los Albaceas' }
        },
        {
            subjectId: 'cdmx-civ', // Amparo/Dto usually federal/civil
            data: { expediente: '974/25-VII', juzgado: '7 Distrito', actor: 'Monse', demandado: 'Desconocido', summary: 'ALEGATOS' }
        },
        // Audiencias context cases
        {
            subjectId: 'cdmx-civ',
            data: { expediente: 'N/A', juzgado: 'Arch Notarias CDMX', actor: 'Srs Beristain', demandado: 'Trámite', summary: 'Pendiente por ir.' }
        },
        {
            subjectId: 'cdmx-pen', // MP usually Penal
            data: { expediente: 'Sin Exp', juzgado: 'MP Azcapotzalco', actor: 'Pedrin', demandado: 'Gabriel', summary: 'Llevar papeles.' }
        },
        {
            subjectId: 'edomex-civ',
            data: { expediente: '1189/23', juzgado: '1F Oral', actor: 'Sra. Borbollita', demandado: 'Desconocido', summary: 'Audiencia Testimonial' }
        },
        {
            subjectId: 'cdmx-civ',
            data: { expediente: '1213/25', juzgado: 'Rec. Nte Sala 7', actor: 'Gabriel', demandado: 'Juez Vict Elías Pacheco', summary: 'Audiencia' }
        },
        // Pendientes extra cases
        {
            subjectId: 'edomex-fam',
            data: { expediente: 'N/A', juzgado: '6 Fam Atizapán', actor: 'Leonardo', demandado: 'Desconocido', summary: 'Checar si ya hay fecha de audiencia.' }
        },
        {
            subjectId: 'cdmx-lab', // Jta 9 Fed sounds Laboral
            data: { expediente: 'N/A', juzgado: 'Jta 9 Fed', actor: 'Dr. Nicolas', demandado: 'Desconocido', summary: 'Urge Llevar Escrito. Agendar visita.' }
        },
        {
            subjectId: 'edomex-fam',
            data: { expediente: '380/2023', juzgado: '2 Fam Oral Soto Meza', actor: 'Desconocido', demandado: 'Desconocido', summary: 'Ver qué se debe hacer.' }
        },
        {
            subjectId: 'cdmx-civ',
            data: { expediente: 'N/A', juzgado: '44 Civil', actor: 'Ortiz López', demandado: 'Desconocido', summary: 'Leer y estudiar expediente.' }
        },
        {
            subjectId: 'cdmx-fam',
            data: { expediente: '06/91', juzgado: '14 Fam', actor: 'NELY hija Ángel', demandado: 'Desconocido', summary: 'Checar si ya se exhibió avalúo.' }
        },
        {
            subjectId: 'edomex-civ', // RPP Tlane
            data: { expediente: 'N/A', juzgado: 'RPP Tlalnepantla', actor: 'Vicky (esposa)', demandado: 'Daniel Mayen', summary: 'Urge Asunto RPP.' }
        },
        {
            subjectId: 'cdmx-fam', // Olivera nul testamento
            data: { expediente: 'N/A', juzgado: 'Olivera', actor: 'Sucesión', demandado: 'Desconocido', summary: 'Nulidad de Testamento - 2 cosas.' }
        }
    ];

    // Map to keep track of created Case IDs to attach tasks
    const createdCases = {}; // 'expediente' -> 'id'

    for (const c of casesToCreate) {
        // Simple dedupe by expediente key if we already added it in this loop
        if (createdCases[c.data.expediente]) continue;

        const newId = await addCase(c.subjectId, c.data);
        createdCases[c.data.expediente] = newId;
        console.log(`Creado caso: ${c.data.expediente} -> ${newId}`);
    }

    // 2. Add Deadlines (Vencimientos) & Hearings (Audiencias)
    const taskList = [
        // Vencimientos
        { findExp: '427/2022', title: 'Vence: Indicar al Juez info completa', date: '2026-01-02', urgent: true },
        { findExp: '186/2025', title: 'Vence: vs auto fianza Albaceas', date: '2026-01-06', urgent: true },
        { findExp: '974/25-VII', title: 'Vence: ALEGATOS', date: '2026-01-20', urgent: true },

        // Audiencias / Citas (Jan 2026)
        { findExp: '427/2022', title: 'Llevar Escrito (Temprano)', date: '2026-01-02', time: '09:00', urgent: true }, // Same exp as 4F Nauc
        { findExp: '889/24', title: 'Recoger copias cert. testamento Olivera', date: '2026-01-05', time: '09:00', urgent: true }, // 5 Fam Olivera matched by name logic later? Or manual linkage. 889/24 is Olivera Glez.
        { findExp: 'Sin Exp', title: 'Llevar papeles Pedrin vs Gabriel (10am)', date: '2026-01-06', time: '10:00', urgent: true }, // MP Azcapotzalco
        { findExp: 'Sin Exp2', title: 'Asunto Olivera MP Azcapotzalco (11am)', date: '2026-01-06', time: '11:00', urgent: true }, // Manual add
        { findExp: '889/24', title: 'Audiencia Olivera lectura Testamento', date: '2026-01-13', time: '12:00', urgent: true },
        { findExp: 'N/A', title: 'Videoconferencia P.J. Edo Mex', date: '2026-01-14', time: '16:00', urgent: false },
        { findExp: '1189/23', title: 'Audiencia Testimonial Sra. Borbollita', date: '2026-01-21', time: '14:00', urgent: true },
        { findExp: '1054/25', title: 'Audiencia Laura (Se encima con ISSSTE)', date: '2026-01-22', time: '11:30', urgent: true },
        { findExp: '974/25-VII', title: 'Audiencia Const. Monse', date: '2026-01-26', time: '10:30', urgent: true },
        { findExp: '1213/25', title: 'Rec. Nte Sala 7 Gabriel vs Juez Vict', date: '2026-03-02', time: '10:00', urgent: true }, // March date

        // Pendientes (Urgent ones without specific date get 'today' or 'soon')
        { findExp: 'N/A', title: 'Metepec/Fabelas: Pedir fecha aud.', date: '2026-01-05', urgent: false },
        { findExp: 'N/A', title: 'Chignahuapan: Saber si aún está el Exp.', date: '2026-01-05', urgent: false },
        { findExp: 'N/A', title: 'Urge: Llevar Esc. Dr Nicolas Jta 9 Fed', date: '2026-01-05', urgent: true },
        { findExp: 'N/A', title: 'Urge: Asunto RPP Tlane (Vicky)', date: '2026-01-05', urgent: true },
        { findExp: 'N/A', title: 'Mandar al ALBACEA ESCRITO DEL CONTADOR', date: '2026-01-05', urgent: false },
        { findExp: 'N/A', title: 'Pago Impuestos WhatsApp Amparo Jorge Jiménez', date: '2026-01-05', urgent: false }
    ];

    for (const t of taskList) {
        // Try to find case ID
        let cId = createdCases[t.findExp];

        // Fuzzy match for ones I didn't explicitly map in keys
        if (!cId) {
            // Fallback: try to find any case with matching string in store
            const allCases = Object.values(appData.cases);
            const match = allCases.find(c => c.expediente === t.findExp || (t.findExp === 'Sin Exp' && c.actor === 'Pedrin'));
            if (match) cId = match.id;
        }

        if (cId) {
            await addTask(cId, { title: t.title, date: t.date, urgent: t.urgent });
        } else {
            // Add as dashboard task (general)
            appData.dashboardTasks.push({
                id: `dt-${Date.now()}-${Math.random()}`,
                title: t.title + (t.findExp !== 'N/A' ? ` (Exp: ${t.findExp})` : ''),
                date: t.date,
                type: t.urgent ? 'urgent' : 'normal',
                caseId: null
            });
        }
    }

    // Save
    saveToLocal();
    // Dispatch events to refresh views
    window.location.reload(); // Hard reload is easiest to see changes
}
