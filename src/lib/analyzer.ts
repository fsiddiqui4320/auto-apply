import { StorageManager } from "./storage";
import type { JobAnalysis } from "@/types";

const PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; // Demo proxy, in prod use own backend

export const JobAnalyzer = {
    async fetchJobContent(url: string): Promise<string> {
        // Add random delay
        const delay = 2000 + Math.random() * 3000;
        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            // Try native fetch first (some sites allow it)
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AutoApply/1.0;)'
                }
            });
            if (response.ok) return await response.text();
            throw new Error('Direct fetch failed');
        } catch (e) {
            // Fallback to proxy
            console.warn('Direct fetch failed, trying proxy...', e);
            const response = await fetch(`${PROXY_URL}${url}`);
            if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
            return await response.text();
        }
    },

    async analyze(htmlContent: string): Promise<JobAnalysis> {
        const settings = StorageManager.get().settings;
        if (!settings.openai_api_key) {
            throw new Error("OpenAI API Key is missing in Settings");
        }

        const ANALYSIS_PROMPT = `
Analyze this job posting HTML and extract structured information.
Return ONLY valid JSON with this exact schema:

{
  "description": "full job description text summary",
  "required_qualifications": ["qual1", "qual2"],
  "preferred_qualifications": ["qual1", "qual2"],
  "technical_skills": ["Python", "React", "AWS"],
  "soft_skills": ["communication", "teamwork"],
  "responsibilities": ["resp1", "resp2"],
  "culture_keywords": ["collaborative", "fast-paced"],
  "internship_duration": "10-12 weeks" or null,
  "compensation": "$X/hour" or null
}

HTML Content:
${htmlContent.substring(0, 15000)} // Truncate to avoid context limits
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.openai_api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: ANALYSIS_PROMPT }],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const jsonStr = data.choices[0].message.content;

        return JSON.parse(jsonStr);
    }
};
