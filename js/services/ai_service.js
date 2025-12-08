/**
 * AI Analysis Service
 * Simulates advanced legal document understanding using heuristics and probabilistic models.
 * In a real-world scenario, this would connect to the Gemini API.
 */

export const AIAnalysisService = {

    /**
     * Analyzes a legal document (image/pdf) to extract metadata.
     * @param {File} file - The file object to analyze.
     * @returns {Promise<Object>} - The analysis result.
     */
    async analyzeDocument(file) {
        return new Promise((resolve) => {
            // Simulate network/processing delay (1.5 - 3 seconds)
            const delay = Math.random() * 1500 + 1500;

            setTimeout(() => {
                const result = this._generateSimulatedAnalysis(file.name);
                resolve(result);
            }, delay);
        });
    },

    /**
     * Generates a plausible analysis based on heuristics.
     */
    _generateSimulatedAnalysis(filename) {
        const lowerName = filename.toLowerCase();

        // Default Scenario: Generic Agreement
        let scenario = {
            type: "Acuerdo General",
            summary: "El juzgado emite un acuerdo de trámite ordinario. Se agregan los escritos presentados por las partes y se ordena lo conducente.",
            legalBasis: "Art. 57 CFPC",
            days: 0,
            action: "Revisar cumplimiento"
        };

        // Heuristics based on keyword matching
        if (lowerName.includes('sentencia') || lowerName.includes('final')) {
            scenario = {
                type: "Sentencia Definitiva",
                summary: "Resolución final del juicio. El Juez ha dictado sentencia valorando las pruebas. Se debe analizar el sentido del fallo (Absolutorio/Condenatorio).",
                legalBasis: "Art. 1336 C. Comercio / Art. 400 CPCDF",
                days: 9, // Term for appeal usually
                action: "Preparar Apelación / Amparo"
            };
        } else if (lowerName.includes('demanda') || lowerName.includes('inicial')) {
            scenario = {
                type: "Auto de Radicación",
                summary: "Se admite la demanda a trámite. Se verifica el emplazamiento al demandado. El juez ordena correr traslado.",
                legalBasis: "Art. 255 CPCDF",
                days: 15, // Answer term
                action: "Contestar Demanda"
            };
        } else if (lowerName.includes('vista') || lowerName.includes('traslado')) {
            scenario = {
                type: "Vista / Traslado",
                summary: "Se da vista con las manifestaciones de la contraparte para que en el término de ley manifieste lo que a su derecho convenga.",
                legalBasis: "Art. 137 CPCDF",
                days: 3,
                action: "Desahogar Vista"
            };
        } else if (lowerName.includes('pruebas') || lowerName.includes('ofrecimiento')) {
            scenario = {
                type: "Advisión de Pruebas",
                summary: "Auto que recae al ofrecimiento de pruebas. Se admiten las pruebas legales y se desechan las improcedentes. Se abre periodo de desahogo.",
                legalBasis: "Art. 290 CPCDF",
                days: 10, // Preparation term
                action: "Preparar Desahogo"
            };
        } else if (lowerName.includes('citatorio') || lowerName.includes('notificacion')) {
            scenario = {
                type: "Notificación / Citatorio",
                summary: "Constancia de notificación personal. El actuario judicial hace constar la diligencia.",
                legalBasis: "Art. 114 CPCDF",
                days: 3,
                action: "Atender Requerimiento"
            };
        }

        // Randomize slightly for "AI" feel
        const deadlineInfo = this._calculateDeadine(scenario.days);

        return {
            summary: scenario.summary,
            type: scenario.type,
            legalBasis: scenario.legalBasis,
            deadline: scenario.days > 0 ? deadlineInfo.dateStr : "N/A",
            deadlineDate: scenario.days > 0 ? deadlineInfo.dateObj : null,
            deadlineDays: scenario.days,
            nextAction: scenario.action,
            confidence: (Math.random() * 0.15 + 0.85).toFixed(2) // 0.85 - 0.99
        };
    },

    /**
     * Calculates deadline skipping weekends.
     */
    _calculateDeadine(businessDays) {
        if (businessDays <= 0) return { dateStr: "N/A", dateObj: null };

        let date = new Date();
        let added = 0;

        while (added < businessDays) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay();
            // Skip Sunday (0) and Saturday (6)
            if (day !== 0 && day !== 6) {
                added++;
            }
        }

        return {
            dateObj: date.toISOString(),
            dateStr: date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) + ` (${businessDays} días hábiles)`
        };
    }
};
