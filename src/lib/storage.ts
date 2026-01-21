import { AppData } from "@/types";

const STORAGE_KEY = 'autoapply_db_v1';

const INITIAL_DATA: AppData = {
    jobs_seen: [],
    jobs_table: [],
    user_profile: {
        personal_info: {
            full_name: '',
            email: '',
            phone: '',
            linkedin_url: '',
            github_url: '',
        },
        education: {
            university: '',
            degree: '',
            major: '',
            graduation_date: '',
        },
        work_authorization: {
            us_citizen: false,
            require_sponsorship: false,
        },
        demographics: {},
        custom_responses: {},
    },
    master_resume: {
        latex_source: '',
        sections: {
            education: '',
            experience: '',
            projects: '',
            skills: '',
        },
        last_modified: new Date().toISOString(),
    },
    activity_log: [],
    settings: {
        rate_limit_delay: 3000,
        auto_check_enabled: false,
        auto_check_time: "09:00",
        notification_enabled: true,
        preferred_locations: [],
    }
};

export class StorageManager {
    static init() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            this.save(INITIAL_DATA);
        }
    }

    private static save(data: AppData) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            // Handle quota exceeded
        }
    }

    static get(): AppData {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return INITIAL_DATA;
            return { ...INITIAL_DATA, ...JSON.parse(data) }; // Merge to ensure new fields are present
        } catch (error) {
            console.error('Failed to parse from localStorage:', error);
            return INITIAL_DATA;
        }
    }

    static set<K extends keyof AppData>(key: K, value: AppData[K]) {
        const current = this.get();
        current[key] = value;
        this.save(current);
    }

    static updateListItem<K extends 'jobs_seen' | 'jobs_table' | 'activity_log'>(
        listKey: K,
        itemId: string,
        updates: Partial<AppData[K][0]>
    ) {
        const current = this.get();
        const list = current[listKey] as any[];
        const index = list.findIndex(item => item.id === itemId);

        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            current[listKey] = list as any;
            this.save(current);
        }
    }

    static clear() {
        localStorage.removeItem(STORAGE_KEY);
        this.save(INITIAL_DATA);
    }

    static export(): string {
        return JSON.stringify(this.get(), null, 2);
    }

    static import(jsonString: string): boolean {
        try {
            const data = JSON.parse(jsonString);
            // Basic validation could go here
            this.save(data);
            return true;
        } catch (error) {
            console.error("Import failed", error)
            return false;
        }
    }
}
