// Global Error Handler - Loaded before everything else
window.onerror = function (msg, url, lineNo, columnNo, error) {
    // Ignore generic "Script error." from cross-origin scripts
    if (msg.toLowerCase().includes('script error')) {
        console.warn('Ignored cross-origin script error:', msg);
        return false;
    }

    const errorMsg = `Error Crítico (Loader):\n${msg}\n\nEn: ${url}:${lineNo}`;
    console.error(errorMsg, error);
    alert(errorMsg); // Always alert on critical failures
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    alert("Error Asíncrono (Promesa):\n" + event.reason);
});
