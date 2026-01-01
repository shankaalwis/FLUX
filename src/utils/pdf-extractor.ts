
import * as pdfjsLib from 'pdfjs-dist';

import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source using Vite's asset handling
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const extractTextFromPDF = async (file: File, password?: string): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            password: password
        }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `--- PAGE ${i} ---\n${pageText}\n`;
        }

        return fullText;
    } catch (error: any) {
        console.error('Error extracting text from PDF:', error);
        if (error.name === 'PasswordException' || error.message?.includes('Password')) {
            throw new Error('PASSWORD_REQUIRED');
        }
        throw new Error('Failed to extract text from PDF');
    }
};
