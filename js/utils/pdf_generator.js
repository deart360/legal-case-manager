export async function generateLegalPdf(images, filename = 'documento.pdf') {
    const { PDFDocument, PageSizes } = PDFLib;

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();

    // Legal Size: 8.5 x 14 inches (612 x 1008 points)
    // pdf-lib uses points (1/72 inch)
    // PageSizes.Legal is [612.0, 1008.0]
    const pageWidth = 612;
    const pageHeight = 1008;

    for (const imgData of images) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Load image
        let image;
        const imgBytes = await fetch(imgData.url).then(res => res.arrayBuffer());

        // Determine type (png/jpg)
        // Simple check based on URL or try/catch
        try {
            image = await pdfDoc.embedPng(imgBytes);
        } catch (e) {
            try {
                image = await pdfDoc.embedJpg(imgBytes);
            } catch (e2) {
                console.error("Could not embed image", imgData.url);
                continue;
            }
        }

        const { width, height } = image.scale(1);

        // Calculate scale to fit within margins (e.g., 20px margin)
        const margin = 40;
        const maxContentWidth = pageWidth - (margin * 2);
        const maxContentHeight = pageHeight - (margin * 2);

        const scaleWidth = maxContentWidth / width;
        const scaleHeight = maxContentHeight / height;
        const scale = Math.min(scaleWidth, scaleHeight, 1); // Don't upscale if smaller

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Center image
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        page.drawImage(image, {
            x: x,
            y: y,
            width: scaledWidth,
            height: scaledHeight,
        });
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Create a Blob
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return blob;
}
