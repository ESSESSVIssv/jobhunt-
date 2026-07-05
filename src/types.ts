export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: string[];
}

export interface Experience {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string[];
}

export interface Education {
  degree?: string;
  school?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Project {
  name?: string;
  description?: string[];
  links?: string[];
}

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  matchPercentage: number;
  matchReason: string;
  tags: string[];
  link?: string;
  platform?: string;
  descriptionSnippet?: string;
}

export interface Resume {
  personalInfo?: PersonalInfo;
  summary?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  certifications?: string[];
}

export interface SavedResumeItem {
  id: string;
  name: string;
  uploadedAt: string;
  data: Resume;
  jobs: JobMatch[];
}

export interface JobAnalysis {
  jobTitle?: string;
  companyName?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  experienceRequired?: string;
  location?: string;
  employmentType?: string;
}

export interface AtsAnalysis {
  atsCompatibilityScore: number;
  resumeStrengthScore: number;
  keywordCoverage: number;
  missingKeywords: string[];
  addedKeywords: string[];
  recruiterReadability: number;
  formattingScore: number;
  resumeReadinessScore: number;
  explanations: Record<string, string>;
}
