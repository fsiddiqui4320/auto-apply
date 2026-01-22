import { StorageManager } from "./storage";
import type { JobSeen, Job } from "@/types";

const GITHUB_API = 'https://api.github.com/repos/SimplifyJobs/Summer2026-Internships/contents/README.md';

/**
 * Validates if the row is a valid job row
 * Looking for pattern: | Company | Role | Location | ...
 */
function parseValues(line: string): string[] {
    // Split by pipe, ignore escaped pipes if any (simplified)
    return line.split('|').map(cell => cell.trim()).filter((_, index) => index !== 0 && index !== line.split('|').length - 1);
}

/**
 * Generate a specialized ID for the job based on core fields
 */
async function generateJobId(company: string, role: string, location: string): Promise<string> {
    const data = `${company}-${role}-${location}`.toLowerCase();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const GitHubScraper = {
    async fetchJobs(): Promise<{ newJobsCount: number, error?: string }> {
        try {
            const response = await fetch(GITHUB_API, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    return { newJobsCount: 0, error: 'GitHub API Rate Limit Exceeded' };
                }
                throw new Error(`GitHub API Error: ${response.status}`);
            }

            const data = await response.json();
            const content = atob(data.content); // Decode Base64

            return await this.processContecnt(content, data.sha);
        } catch (error: any) {
            console.error('Scraper Error:', error);
            return { newJobsCount: 0, error: error.message };
        }
    },

    async processContecnt(markdown: string, sha: string): Promise<{ newJobsCount: number }> {
        const lines = markdown.split('\n');
        let isTable = false;
        let newJobsCount = 0;

        // Get existing seen jobs to avoid duplicates
        const appData = StorageManager.get();
        const seenIds = new Set(appData.jobs_seen.map(j => j.id));
        const newJobsSeen: JobSeen[] = [];
        const newJobsTable: Job[] = [];

        const now = new Date().toISOString();

        for (const line of lines) {
            if (line.includes('| Company | Role | Location |')) {
                isTable = true;
                continue;
            }
            if (line.includes('| --- |')) continue;
            if (!isTable) continue;
            if (line.trim() === '') {
                // End of table? potentially, but safe to continue
                continue;
            }

            // Parse row
            // Expected: | Company | Role | Location | Date Posted |
            // Adjust based on actual repo columns. Usually: | Company | Role | Location | Application/Link | Date Posted |
            // NOTE: SimplifyJobs usually has: | **Name** | Location | Notes | Date Posted |
            // We will try to detect 4-5 columns.

            const cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);

            if (cols.length < 3) continue;

            // Heuristic parsing:
            // Col 0: Company (often has link: [Name](url))
            // Col 1: Role
            // Col 2: Location
            // Col 3: Link/Application
            // Col 4: Date

            let company = cols[0] || 'Unknown';
            let role = cols[1] || 'Intern';
            let location = cols[2] || 'Remote';
            let link = '';

            // Extract link from Company or separate column
            const linkMatch = company.match(/\[(.*?)\]\((.*?)\)/);
            if (linkMatch) {
                company = linkMatch[1];
                // Check if the link is in the company column or we need to look elsewhere
                // SimplyJobs repo: | Company | Role | Location | Application/Link | Date Posted |
            }

            // Extract Application Link
            // Sometimes in 4th column
            if (cols[3]) {
                const appLinkMatch = cols[3].match(/href="(.*?)"/) || cols[3].match(/\((.*?)\)/);
                if (appLinkMatch) {
                    link = appLinkMatch[1];
                } else {
                    // Try raw check
                    if (cols[3].startsWith('http')) link = cols[3];
                }
            }

            // If we still don't have a link, fail gracefully or skip
            if (!link) continue;

            const id = await generateJobId(company, role, location);

            if (!seenIds.has(id)) {
                newJobsCount++;
                seenIds.add(id);

                const jobSeen: JobSeen = {
                    id,
                    company,
                    role,
                    location,
                    date_posted: cols[4] || now,
                    url: link,
                    sha,
                    date_discovered: now
                };

                const job: Job = {
                    id,
                    company,
                    role,
                    location,
                    date_posted: cols[4] || now,
                    url: link,
                    status: 'new',
                    created_at: now,
                    updated_at: now
                };

                newJobsSeen.push(jobSeen);
                newJobsTable.push(job);
            }
        }

        if (newJobsCount > 0) {
            // Bulk update storage
            const current = StorageManager.get();
            current.jobs_seen = [...current.jobs_seen, ...newJobsSeen];
            current.jobs_table = [...current.jobs_table, ...newJobsTable];

            // Add log
            current.activity_log.unshift({
                id: crypto.randomUUID(),
                timestamp: now,
                action: 'job_discovered',
                details: `Found ${newJobsCount} new jobs`,
                status: 'success'
            });

            // Save via StorageManager private save logic workaround or re-set
            // Since Set updates the whole object, this is fine
            StorageManager.set('jobs_seen', current.jobs_seen);
            StorageManager.set('jobs_table', current.jobs_table);
            StorageManager.set('activity_log', current.activity_log);
        }

        return { newJobsCount };
    }
};
