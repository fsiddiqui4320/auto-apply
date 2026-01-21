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
        if (!settings.anthropic_api_key) {
            throw new Error("Anthropic API Key is missing in Settings");
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

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': settings.anthropic_api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'dangerously-allow-browser': 'true' // Client-side call
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1500,
                messages: [{ role: 'user', content: ANALYSIS_PROMPT }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Anthropic API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const jsonStr = data.content[0].text;

        // Extract JSON from response (sometimes strictly formatted, sometimes not)
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Failed to parse JSON from AI response");

        return JSON.parse(jsonMatch[0]);
    }
};
