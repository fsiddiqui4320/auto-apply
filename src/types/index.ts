export interface JobSeen {
    id: string; // unique hash of company+role+location
    company: string;
    role: string;
    location: string;
    date_posted: string; // ISO format
    url: string;
    sha: string; // GitHub file SHA for change detection
    date_discovered: string; // ISO timestamp
}

export interface JobAnalysis {
    description: string;
    required_qualifications: string[];
    preferred_qualifications: string[];
    technical_skills: string[];
    soft_skills: string[];
    responsibilities: string[];
    culture_keywords: string[];
    internship_duration?: string;
    compensation?: string;
}

export interface ApplicationData {
    submitted_at?: string;
    portal_url?: string;
    notes?: string;
}

export interface Job {
    id: string;
    company: string;
    role: string;
    location: string;
    date_posted: string;
    url: string;
    status: 'new' | 'analyzing' | 'analysis_complete' | 'resume_generated' | 'applied' | 'failed' | 'skipped';
    analysis?: JobAnalysis;
    resume_latex?: string;
    resume_pdf_blob?: string; // Base64 encoded
    cover_letter?: string;
    application_data?: ApplicationData;
    error?: string;
    created_at: string;
    updated_at: string;
}

export interface MasterResume {
    latex_source: string;
    sections: {
        education: string;
        experience: string;
        projects: string; // Array of individual project blocks
        skills: string;
    };
    last_modified: string;
}

export interface UserProfile {
    personal_info: {
        full_name: string;
        email: string;
        phone: string;
        linkedin_url: string;
        github_url: string;
        portfolio_url?: string;
    };
    education: {
        university: string;
        degree: string;
        major: string;
        graduation_date: string;
        gpa?: string;
    };
    work_authorization: {
        us_citizen: boolean;
        require_sponsorship: boolean;
    };
    demographics: {
        gender?: string;
        ethnicity?: string;
        race?: string;
        veteran_status?: string;
        disability_status?: string;
    };
    custom_responses: {
        [question: string]: string;
    };
}

export interface ActivityLog {
    id: string;
    timestamp: string; // ISO
    action: 'job_discovered' | 'job_analyzed' | 'resume_generated' | 'application_submitted' | 'error' | 'user_action';
    job_id?: string;
    details: string;
    status: 'success' | 'failed' | 'pending';
}

export interface AppSettings {
    rate_limit_delay: number; // ms
    auto_check_enabled: boolean;
    auto_check_time: string;
    notification_enabled: boolean;
    preferred_locations: string[];
    openai_api_key?: string;
    github_token?: string;
}

export interface AppData {
    jobs_seen: JobSeen[];
    jobs_table: Job[];
    user_profile: UserProfile;
    master_resume: MasterResume;
    activity_log: ActivityLog[];
    settings: AppSettings;
}
