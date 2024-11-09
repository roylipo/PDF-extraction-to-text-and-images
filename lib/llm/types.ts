export interface CVAnalysis {
    candidate_name?: string;
    position?: string;
    email?: string;
    phone?: string;
    location?: string;
    social_profiles?: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
        twitter?: string;
        other?: string[];
    };
    education?: {
        degree?: string;
        institution?: string;
        year?: string;
    }[];
    experience?: {
        title?: string;
        company?: string;
        duration?: string;
        description?: string;
    }[];
    skills?: string[];
    languages?: string[];
    military_service?: {
        role?: string;
        unit?: string;
        years?: string;
    };
}

export interface LLMProvider {
    analyzeBasicInfo: (text: string) => Promise<Pick<CVAnalysis, 'candidate_name' | 'position' | 'email' | 'phone' | 'location'>>;
    analyzeExperience: (text: string) => Promise<Pick<CVAnalysis, 'experience'>>;
    analyzeEducation: (text: string) => Promise<Pick<CVAnalysis, 'education'>>;
    analyzeSkills: (text: string) => Promise<Pick<CVAnalysis, 'skills' | 'languages'>>;
    analyzeMilitary: (text: string) => Promise<Pick<CVAnalysis, 'military_service'>>;
    name: string;
} 