/**
 * Firebase Configuration
 * Configuración conectada al proyecto: "gention-de-asuntos-y-despacho"
 */

const firebaseConfig = {
    apiKey: "AIzaSyCC8K_DNqE92UMMJUAJQLrL3x-qg3Ql_y8",
    authDomain: "gention-de-asuntos-y-despacho.firebaseapp.com",
    projectId: "gention-de-asuntos-y-despacho",
    storageBucket: "gention-de-asuntos-y-despacho.firebasestorage.app",
    messagingSenderId: "114087182846",
    appId: "1:114087182846:web:eeae9fad364c045e5f00af",
    measurementId: "G-FYLKNWVV4P"
};

// Initialize Firebase
let db, storage, analytics;

try {
    // Usamos la versión 'compat' (global) ya que importamos los scripts en index.html
    const app = firebase.initializeApp(firebaseConfig);

    db = firebase.firestore();
    storage = firebase.storage();
    analytics = firebase.analytics();

    console.log("✅ Firebase conectado: " + firebaseConfig.projectId);

    // --- VERIFICACIÓN DE CONEXIÓN ---
    // Intentamos escribir un documento de prueba para confirmar que la base de datos está activa.
    db.collection('_connection_test').add({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'ok'
    }).then(() => {
        console.log("🟢 CONEXIÓN EXITOSA: La base de datos está respondiendo correctamente.");

        // Visual Indicator Update (Sidebar)
        const statusInd = document.getElementById('firebase-status-indicator');
        if (statusInd) {
            statusInd.classList.add('connected');
            statusInd.title = "Conectado a Firebase: " + firebaseConfig.projectId;
        }

    }).catch((error) => {
        console.error("🔴 ERROR DE CONEXIÓN: No se pudo escribir en la base de datos.", error);

        const statusInd = document.getElementById('firebase-status-indicator');
        if (statusInd) {
            statusInd.classList.add('error');
            statusInd.title = "Error de conexión: " + error.message;
        }

        if (error.code === 'permission-denied') {
            console.warn("⚠️ PERMISO DENEGADO");
            // Only alert for critical permission errors that block usage
            alert("Atención: Firebase conectado pero sin permisos de escritura. Revisa la consola.");
        }
    });

} catch (e) {
    console.error("❌ Error inicializando Firebase:", e);
}

export { db, storage, analytics };
