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
    const auth = firebase.auth();

    // Sign in anonymously to ensure we have a valid session for rules
    auth.signInAnonymously()
        .then(() => {
            console.log("✅ Firebase Auth: Firmado anónimamente");
        })
        .catch((error) => {
            console.error("❌ Firebase Auth Error:", error);
        });

    console.log("✅ Firebase conectado: " + firebaseConfig.projectId);

} catch (e) {
    console.error("❌ Error inicializando Firebase:", e);
}

export function checkConnection() {
    const statusInd = document.getElementById('firebase-status-indicator');
    if (!statusInd) return;

    if (db) {
        // Simple check: if db object exists, we assume connected for UI purposes
        // Real connectivity is handled by Firestore offline persistence
        statusInd.classList.add('connected');
        statusInd.title = "Conectado a Firebase";
    }
}

export { db, storage, analytics };
