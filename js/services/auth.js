
// Hardcoded users for MVP
const USERS = [
    { uid: 'u1', username: 'diego', password: '400463', name: 'Diego Amador', role: 'user', initials: 'DA' },
    { uid: 'u2', username: 'pablin', password: '8888', name: 'Pablo Amador', role: 'admin', initials: 'PA' },
    { uid: 'u3', username: 'angeles', password: '12345', name: 'Angeles Izquierdo', role: 'user', initials: 'AI' }
];

const SESSION_KEY = 'legal_case_manager_session';

export const AuthService = {
    login(username, password) {
        const user = USERS.find(u => u.username === username && u.password === password);
        if (user) {
            // Create session object (exclude password)
            const session = {
                uid: user.uid,
                username: user.username,
                name: user.name,
                role: user.role,
                initials: user.initials,
                loginTime: Date.now()
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return { success: true, user: session };
        }
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    },

    logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.hash = '#login';
        window.location.reload(); // Force reload to clear state
    },

    getCurrentUser() {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;
        try {
            return JSON.parse(sessionStr);
        } catch (e) {
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getCurrentUser();
    },

    // Helper to get user signature for actions
    getUserSignature() {
        const user = this.getCurrentUser();
        if (!user) return { name: 'Sistema', uid: 'system', timestamp: Date.now() };
        return {
            name: user.name,
            uid: user.uid,
            timestamp: Date.now()
        };
    }
};
