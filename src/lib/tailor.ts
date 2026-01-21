import { StorageManager } from "./storage";
import type { JobAnalysis, MasterResume } from "@/types";

export const ResumeTailor = {
    async generateTailoredResume(jobAnalysis: JobAnalysis, masterResume: MasterResume): Promise<string> {
        const settings = StorageManager.get().settings;
        if (!settings.anthropic_api_key) {
            throw new Error("Anthropic API Key is missing");
        }

        const SYSTEM_PROMPT = `
You are a resume tailoring expert. Given a master LaTeX resume and a job analysis, generate a tailored version.

CRITICAL RULES:
1. PRESERVE the exact LaTeX structure, formatting, and all special characters/commands
2. ONLY modify content within sections (bullet points, descriptions)
3. DO NOT reorder sections
4. DO NOT change contact info, education details, or formatting
5. Rewrite experience bullet points to emphasize relevant skills and mirror job keywords
6. Select 3-4 most relevant projects from the master resume projects list (if applicable)
7. Adjust skills section to highlight tools/languages mentioned in job posting
8. Keep all changes subtle and professional
9. Return COMPLETE modified LaTeX file ready to compile
`;

        const USER_PROMPT = `
Master Resume LaTeX:
${masterResume.latex_source}

Job Analysis:
${JSON.stringify(jobAnalysis, null, 2)}

Required Skills from Job: ${jobAnalysis.technical_skills.join(", ")}

Return the complete tailored LaTeX resume. Do not wrap in markdown code blocks, just return the raw LaTeX string.
`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': settings.anthropic_api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4000,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: USER_PROMPT }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Anthropic API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let text = data.content[0].text;

        // Cleanup markdown wrapping if present
        if (text.startsWith('```latex')) text = text.replace(/^```latex\n/, '').replace(/\n```$/, '');
        if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

        return text;
    }
};
