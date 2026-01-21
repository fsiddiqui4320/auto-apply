export const PDFCompiler = {
    async compile(latexSource: string): Promise<Blob> {
        // Primary: LaTeX.Online
        try {
            const response = await fetch('https://latexonline.cc/compile', {
                method: 'POST',
                headers: {
                    // 'Content-Type': 'application/x-www-form-urlencoded', // usually works without if FormData or raw text
                },
                body: `text=${encodeURIComponent(latexSource)}&command=pdflatex`
            });

            if (!response.ok) {
                throw new Error(`LaTeX.Online compilation failed: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            console.warn('Primary PDF compilation failed, trying fallback...', error);
            // Fallback or re-throw
            throw error;
        }
    },

    createUrl(blob: Blob): string {
        return URL.createObjectURL(blob);
    }
};
