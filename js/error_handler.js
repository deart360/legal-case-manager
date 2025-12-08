// Global Error Handler - Loaded before everything else
window.onerror = function (msg, url, lineNo, columnNo, error) {
    // Ignore generic "Script error." from cross-origin scripts
    if (msg.toLowerCase().includes('script error')) {
        console.warn('Ignored cross-origin script error:', msg);
        return false;
    }

    const errorMsg = `Error Crítico (Loader):\n${msg}\n\nEn: ${url}:${lineNo}`;
    console.error(errorMsg, error);

    // Write directly to document to be visible even if UI fails
    const errDiv = document.createElement('div');
    errDiv.style.position = 'fixed';
    errDiv.style.top = '0';
    errDiv.style.left = '0';
    errDiv.style.width = '100%';
    errDiv.style.background = 'red';
    errDiv.style.color = 'white';
    errDiv.style.padding = '20px';
    errDiv.style.zIndex = '999999';
    errDiv.innerText = errorMsg;
    document.body.appendChild(errDiv);

    return false;
};

console.log("Error Handler Loaded");
