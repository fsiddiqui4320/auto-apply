import { StorageManager } from "./storage";
import type { JobAnalysis, MasterResume } from "@/types";

export const ResumeTailor = {
    async generateTailoredResume(jobAnalysis: JobAnalysis, masterResume: MasterResume): Promise<string> {
        const settings = StorageManager.get().settings;
        if (!settings.openai_api_key) {
            throw new Error("OpenAI API Key is missing");
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.openai_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: USER_PROMPT }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let text = data.choices[0].message.content;

        // Cleanup markdown wrapping if present
        if (text.startsWith('```latex')) text = text.replace(/^```latex\n/, '').replace(/\n```$/, '');
        if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

        return text;
    },

    async generateCoverLetter(jobAnalysis: JobAnalysis): Promise<string> {
        const settings = StorageManager.get().settings;
        const profile = StorageManager.get().user_profile;
        if (!settings.openai_api_key) throw new Error("OpenAI API Key is missing");

        const PROMPT = `
Generate a professional cover letter for this internship application.

Template structure:
- Opening: Express enthusiasm for specific role and company
- Body paragraph 1: Highlight 2-3 relevant experiences/projects that match job requirements
- Body paragraph 2: Explain why you're interested in this company specifically
- Closing: Thank them and express interest in discussing further

Keep it concise (3 paragraphs), professional, and genuine.
Use keywords from job description naturally.

Job Details:
Job Analysis: ${JSON.stringify(jobAnalysis)}

Candidate Profile: 
${JSON.stringify(profile.personal_info)}
${JSON.stringify(profile.education)}

Generate cover letter:
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.openai_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: PROMPT }]
            })
        });

        if (!response.ok) throw new Error(`OpenAI API Error: ${response.statusText}`);
        const data = await response.json();
        return data.choices[0].message.content;
    }
};
