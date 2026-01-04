
import * as pdfjsLib from 'pdfjs-dist';

// Define the worker source
// Note: This relies on Vite handling the worker import correctly
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export async function extractTextFromPdf(file: File, password?: string): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            password: password,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error: any) {
        if (error.name === 'PasswordException') {
            throw new Error('Incorrect password');
        }
        throw error;
    }
}
